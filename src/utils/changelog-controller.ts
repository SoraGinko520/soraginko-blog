import type { ChangelogLink } from "@/utils/changelog";
import { definePageIsland } from "@/utils/swup-lifecycle";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const WIRE_REVEAL_DURATION = 220;
const RELATED_HIGHLIGHT_DURATION = 1300;
const ROW_WIRE_OFFSET = 12;
const WIRE_CURVE_LIMIT = 56;

function readLinks(card: HTMLElement): ChangelogLink[] {
	try {
		const value: unknown = JSON.parse(card.dataset.links || "[]");
		if (!Array.isArray(value)) return [];
		return value.flatMap((item: unknown) => {
			if (
				!item ||
				typeof item !== "object" ||
				!("target" in item) ||
				!("sharedPages" in item) ||
				typeof item.target !== "number" ||
				!Number.isInteger(item.target) ||
				!Array.isArray(item.sharedPages)
			)
				return [];
			return [
				{
					target: item.target,
					sharedPages: item.sharedPages.filter(
						(page: unknown): page is string => typeof page === "string",
					),
				},
			];
		});
	} catch (error) {
		console.warn("更新日志关联数据无法读取。", error);
		return [];
	}
}

function readPageLabels(root: HTMLElement): Record<string, string> {
	try {
		const value: unknown = JSON.parse(root.dataset.pageLabels || "{}");
		if (!value || typeof value !== "object" || Array.isArray(value)) return {};
		return Object.fromEntries(
			Object.entries(value).filter(([, label]) => typeof label === "string"),
		);
	} catch (error) {
		console.warn("更新日志页面名称无法读取。", error);
		return {};
	}
}

function mountChangelogGraph(root: HTMLElement): () => void {
	const grid = root.querySelector<HTMLElement>("[data-changelog-grid]");
	const wires = root.querySelector<SVGSVGElement>("[data-changelog-wires]");
	const dialog = root.querySelector<HTMLDialogElement>(
		"[data-changelog-dialog]",
	);
	const dialogTitle = dialog?.querySelector<HTMLElement>("[data-dialog-title]");
	const dialogNumber = dialog?.querySelector<HTMLElement>("[data-dialog-num]");
	const dialogType = dialog?.querySelector<HTMLElement>("[data-dialog-type]");
	const dialogDate =
		dialog?.querySelector<HTMLTimeElement>("[data-dialog-date]");
	const dialogDetail = dialog?.querySelector<HTMLElement>(
		"[data-dialog-detail]",
	);
	const dialogPages = dialog?.querySelector<HTMLElement>("[data-dialog-pages]");
	const relatedSection = dialog?.querySelector<HTMLElement>(
		"[data-dialog-related-section]",
	);
	const relatedList = dialog?.querySelector<HTMLElement>(
		"[data-dialog-related]",
	);
	const closeButton = dialog?.querySelector<HTMLButtonElement>(
		"[data-changelog-close]",
	);
	if (
		!grid ||
		!wires ||
		!dialog ||
		!dialogTitle ||
		!dialogNumber ||
		!dialogType ||
		!dialogDate ||
		!dialogDetail ||
		!dialogPages ||
		!relatedSection ||
		!relatedList ||
		!closeButton
	)
		return () => {};

	const controller = new AbortController();
	const { signal } = controller;
	const cards = Array.from(
		grid.querySelectorAll<HTMLElement>("[data-changelog-card]"),
	);
	const cardLinks = new Map(cards.map((card) => [card, readLinks(card)]));
	const pageLabels = readPageLabels(root);
	const sharedPrefix = root.dataset.sharedPrefix || "";
	const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
	const animations = new Set<Animation>();
	const highlightTimers = new Map<HTMLElement, number>();
	let activeCard: HTMLElement | null = null;
	let returnFocus: HTMLElement | null = null;
	let relatedTarget: HTMLElement | null = null;
	let layoutFrame = 0;
	let measureFrame = 0;
	let isVisible = true;
	let isDestroyed = false;

	const getCard = (target: EventTarget | null): HTMLElement | null => {
		if (!(target instanceof Element)) return null;
		const card = target.closest<HTMLElement>("[data-changelog-card]");
		return card && grid.contains(card) ? card : null;
	};

	const clearAssociations = (): void => {
		for (const animation of animations) animation.cancel();
		animations.clear();
		root.querySelectorAll("[data-hover-wire]").forEach((node) => {
			node.remove();
		});
		root.classList.remove("is-hovering");
		for (const card of cards) card.classList.remove("is-active", "is-linked");
	};

	const makePath = (pathData: string, className: string): SVGPathElement => {
		const path = document.createElementNS(SVG_NAMESPACE, "path");
		path.setAttribute("d", pathData);
		path.setAttribute("class", className);
		path.setAttribute("marker-end", "url(#changelog-arrow)");
		return path;
	};

	const reveal = (element: Element): void => {
		if (motionQuery.matches || !isVisible || document.hidden) return;
		// 仅在交互时一次性渐显小面积 SVG/标签，不保留流动虚线或逐帧布局读取。
		const animation = element.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: WIRE_REVEAL_DURATION,
			easing: "ease-out",
		});
		animations.add(animation);
		animation.addEventListener("finish", () => animations.delete(animation), {
			once: true,
		});
	};

	const drawAssociations = (card: HTMLElement): void => {
		if (!isVisible || document.hidden || dialog.open) {
			clearAssociations();
			return;
		}
		const links = cardLinks.get(card) ?? [];
		if (!links.length) {
			clearAssociations();
			return;
		}
		// 先一次性读取全部几何，再生成连线，避免同一帧交错读写布局。
		const rootBox = root.getBoundingClientRect();
		const boxes = cards.map((item) => item.getBoundingClientRect());
		const fromBox = boxes[cards.indexOf(card)];
		if (!fromBox) return;
		clearAssociations();
		const edgePoint = (
			box: DOMRect,
			center: { x: number; y: number },
			toward: { x: number; y: number },
		): { x: number; y: number } => {
			const dx = toward.x - center.x;
			const dy = toward.y - center.y;
			const factor = Math.min(
				dx ? box.width / (2 * Math.abs(dx)) : Number.POSITIVE_INFINITY,
				dy ? box.height / (2 * Math.abs(dy)) : Number.POSITIVE_INFINITY,
			);
			return { x: center.x + dx * factor, y: center.y + dy * factor };
		};
		root.classList.add("is-hovering");
		card.classList.add("is-active");
		for (const link of links) {
			const target = cards[link.target];
			const toBox = boxes[link.target];
			if (!target || !toBox) continue;
			target.classList.add("is-linked");
			const from = {
				x: fromBox.left - rootBox.left + fromBox.width / 2,
				y: fromBox.top - rootBox.top + fromBox.height / 2,
			};
			const to = {
				x: toBox.left - rootBox.left + toBox.width / 2,
				y: toBox.top - rootBox.top + toBox.height / 2,
			};
			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const distance = Math.hypot(dx, dy) || 1;
			const bend = Math.min(WIRE_CURVE_LIMIT, distance * 0.12);
			const control = {
				x: (from.x + to.x) / 2 - (dy / distance) * bend,
				y: (from.y + to.y) / 2 + (dx / distance) * bend,
			};
			const startsAtCard = link.target < cards.indexOf(card);
			const fromEdge = edgePoint(fromBox, from, control);
			const toEdge = edgePoint(toBox, to, control);
			const start = startsAtCard ? fromEdge : toEdge;
			const end = startsAtCard ? toEdge : fromEdge;
			const path = makePath(
				`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
				"changelog-wire changelog-wire--hover",
			);
			path.setAttribute("data-hover-wire", "");
			wires.appendChild(path);
			const label = document.createElement("span");
			label.className = "changelog-wire-label";
			label.textContent = link.sharedPages
				.map((page) => pageLabels[page] || page)
				.join("、");
			label.setAttribute("data-hover-wire", "");
			label.setAttribute("aria-hidden", "true");
			const middleX = (from.x + to.x) / 4 + control.x / 2;
			label.style.left = `${Math.max(rootBox.width / 4, Math.min(rootBox.width * 0.75, middleX))}px`;
			label.style.top = `${(from.y + to.y) / 4 + control.y / 2}px`;
			root.appendChild(label);
			reveal(path);
			reveal(label);
		}
	};

	const drawRows = (columns: number): void => {
		const rootBox = root.getBoundingClientRect();
		const boxes = cards.map((card) => card.getBoundingClientRect());
		wires.setAttribute("viewBox", `0 0 ${rootBox.width} ${rootBox.height}`);
		wires.querySelectorAll("[data-row-arrow]").forEach((node) => {
			node.remove();
		});
		for (let row = 0; row < Math.ceil(cards.length / columns) - 1; row += 1) {
			const newer = boxes[row * columns + columns - 1];
			const older = boxes[(row + 1) * columns];
			if (!newer || !older) continue;
			const newerY = newer.top - rootBox.top + newer.height / 2;
			const olderY = older.top - rootBox.top + older.height / 2;
			const newerX = (row % 2 === 0 ? newer.right : newer.left) - rootBox.left;
			const olderX = (row % 2 === 0 ? older.right : older.left) - rootBox.left;
			const outside =
				row % 2 === 0
					? Math.min(
							rootBox.width - 1,
							Math.max(newerX, olderX) + ROW_WIRE_OFFSET,
						)
					: Math.max(1, Math.min(newerX, olderX) - ROW_WIRE_OFFSET);
			const path = makePath(
				`M ${olderX} ${olderY} H ${outside} V ${newerY} H ${newerX}`,
				"changelog-wire changelog-wire--row",
			);
			path.setAttribute("data-row-arrow", "");
			wires.appendChild(path);
		}
		if (activeCard) {
			measureFrame = requestAnimationFrame(() => {
				measureFrame = 0;
				if (activeCard) drawAssociations(activeCard);
			});
		}
	};

	const cancelLayout = (): void => {
		cancelAnimationFrame(layoutFrame);
		cancelAnimationFrame(measureFrame);
		layoutFrame = 0;
		measureFrame = 0;
	};

	const scheduleLayout = (): void => {
		if (isDestroyed || document.hidden || !isVisible) return;
		cancelLayout();
		layoutFrame = requestAnimationFrame(() => {
			layoutFrame = 0;
			const columns = Math.max(
				1,
				getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean)
					.length,
			);
			cards.forEach((card, index) => {
				const row = Math.floor(index / columns);
				const column = index % columns;
				const visualColumn = row % 2 === 0 ? column : columns - 1 - column;
				card.style.gridRowStart = String(row + 1);
				card.style.gridColumnStart = String(visualColumn + 1);
			});
			// 蛇形位置写入后的测量留到下一帧；尺寸变化才触发布局，不监听滚动。
			measureFrame = requestAnimationFrame(() => {
				measureFrame = 0;
				drawRows(columns);
			});
		});
	};

	const copyContent = (
		destination: HTMLElement,
		source: Element | null,
	): void => {
		destination.replaceChildren(
			...Array.from(source?.childNodes ?? [], (node) => node.cloneNode(true)),
		);
	};

	const onDialogClosed = (): void => {
		document.documentElement.classList.remove("changelog-dialog-open");
		const focusTarget =
			relatedTarget?.querySelector<HTMLButtonElement>(
				"[data-changelog-open]",
			) ?? returnFocus;
		if (focusTarget?.isConnected && !isDestroyed)
			focusTarget.focus({ preventScroll: true });
		if (relatedTarget?.isConnected && !isDestroyed) {
			const target = relatedTarget;
			target.scrollIntoView({
				behavior: motionQuery.matches ? "instant" : "smooth",
				block: "center",
			});
			target.classList.add("is-flash");
			clearTimeout(highlightTimers.get(target));
			highlightTimers.set(
				target,
				window.setTimeout(() => {
					target.classList.remove("is-flash");
					highlightTimers.delete(target);
				}, RELATED_HIGHLIGHT_DURATION),
			);
		}
		returnFocus = null;
		relatedTarget = null;
	};

	const openDialog = (card: HTMLElement): void => {
		clearAssociations();
		returnFocus = card.querySelector<HTMLButtonElement>(
			"[data-changelog-open]",
		);
		dialogTitle.textContent =
			card.querySelector(".changelog-card__title")?.textContent || "";
		dialogNumber.textContent = `#${card.dataset.num}`;
		dialogType.textContent =
			card.querySelector(".changelog-card__type")?.textContent || "";
		dialogType.dataset.type = card.dataset.type || "";
		const date = card.querySelector<HTMLTimeElement>(".changelog-card__date");
		dialogDate.textContent = date?.textContent || "";
		dialogDate.dateTime = date?.dateTime || "";
		// 只复制构建期已经清洗过的节点，不使用 innerHTML 字符串拼接。
		copyContent(
			dialogDetail,
			card.querySelector(".changelog-card__detail-body"),
		);
		copyContent(dialogPages, card.querySelector(".changelog-card__pages"));
		relatedList.replaceChildren();
		const links = cardLinks.get(card) ?? [];
		relatedSection.hidden = links.length === 0;
		for (const link of links) {
			const target = cards[link.target];
			if (!target) continue;
			const item = document.createElement("li");
			const button = document.createElement("button");
			button.type = "button";
			button.className = "changelog-dialog__related-btn";
			button.dataset.relatedIndex = String(link.target);
			for (const [className, value] of [
				["changelog-dialog__related-num", `#${target.dataset.num}`],
				[
					"changelog-dialog__related-title",
					target.querySelector(".changelog-card__title")?.textContent || "",
				],
				[
					"changelog-dialog__related-pages",
					`${sharedPrefix}：${link.sharedPages.map((page) => pageLabels[page] || page).join("、")}`,
				],
			]) {
				const span = document.createElement("span");
				span.className = className;
				span.textContent = value;
				button.appendChild(span);
			}
			item.appendChild(button);
			relatedList.appendChild(item);
		}
		if (!dialog.open) dialog.showModal();
		document.documentElement.classList.add("changelog-dialog-open");
		closeButton.focus({ preventScroll: true });
	};

	grid.addEventListener(
		"pointerover",
		(event) => {
			if (event.pointerType === "touch") return;
			const card = getCard(event.target);
			if (!card || card === activeCard) return;
			activeCard = card;
			drawAssociations(card);
		},
		{ signal },
	);
	grid.addEventListener(
		"pointerleave",
		() => {
			activeCard = getCard(document.activeElement);
			if (activeCard) drawAssociations(activeCard);
			else clearAssociations();
		},
		{ signal },
	);
	grid.addEventListener(
		"focusin",
		(event) => {
			activeCard = getCard(event.target);
			if (activeCard) drawAssociations(activeCard);
		},
		{ signal },
	);
	grid.addEventListener(
		"focusout",
		(event) => {
			if (getCard(event.relatedTarget)) return;
			activeCard = null;
			clearAssociations();
		},
		{ signal },
	);
	grid.addEventListener(
		"click",
		(event) => {
			if (
				!(event.target instanceof Element) ||
				!event.target.closest("[data-changelog-open]")
			)
				return;
			const card = getCard(event.target);
			if (card) openDialog(card);
		},
		{ signal },
	);
	closeButton.addEventListener("click", () => dialog.close(), { signal });
	dialog.addEventListener("close", onDialogClosed, { signal });
	dialog.addEventListener(
		"click",
		(event) => {
			if (event.target !== dialog) return;
			const box = dialog.getBoundingClientRect();
			if (
				event.clientX < box.left ||
				event.clientX > box.right ||
				event.clientY < box.top ||
				event.clientY > box.bottom
			)
				dialog.close();
		},
		{ signal },
	);
	relatedList.addEventListener(
		"click",
		(event) => {
			if (!(event.target instanceof Element)) return;
			const button = event.target.closest<HTMLButtonElement>(
				"[data-related-index]",
			);
			if (!button) return;
			relatedTarget = cards[Number(button.dataset.relatedIndex)] ?? null;
			dialog.close();
		},
		{ signal },
	);
	motionQuery.addEventListener(
		"change",
		() => {
			if (activeCard) drawAssociations(activeCard);
			else clearAssociations();
		},
		{ signal },
	);
	document.addEventListener(
		"visibilitychange",
		() => {
			if (document.hidden) {
				cancelLayout();
				clearAssociations();
			} else scheduleLayout();
		},
		{ signal },
	);

	const resizeObserver = new ResizeObserver(scheduleLayout);
	resizeObserver.observe(grid);
	const visibilityObserver = new IntersectionObserver(([entry]) => {
		isVisible = Boolean(entry?.isIntersecting);
		if (isVisible) scheduleLayout();
		else {
			cancelLayout();
			clearAssociations();
		}
	});
	visibilityObserver.observe(root);
	scheduleLayout();

	return () => {
		isDestroyed = true;
		controller.abort();
		resizeObserver.disconnect();
		visibilityObserver.disconnect();
		cancelLayout();
		clearAssociations();
		for (const [card, timer] of highlightTimers) {
			clearTimeout(timer);
			card.classList.remove("is-flash");
		}
		highlightTimers.clear();
		if (dialog.open) dialog.close();
		document.documentElement.classList.remove("changelog-dialog-open");
		activeCard = null;
		returnFocus = null;
		relatedTarget = null;
	};
}

/** 关于页进出使用同一生命周期，导航前拆掉弹层、观察器与所有短时动画。 */
export function registerChangelogGraph(): void {
	let cleanup: (() => void) | undefined;
	definePageIsland({
		name: "changelog-graph",
		mount: () => {
			const root = document.querySelector<HTMLElement>("[data-changelog]");
			if (root) cleanup = mountChangelogGraph(root);
		},
		unmount: () => {
			cleanup?.();
			cleanup = undefined;
		},
	});
}
