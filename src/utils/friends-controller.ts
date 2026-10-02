import { revealImageWithPixels } from "@/utils/image-pixel-reveal";

/** 每次进入友链页独立挂载，离开时撤销媒体监听与 body 预览。 */
export function initFriendsPage(): () => void {
	const root = document.querySelector<HTMLElement>("[data-friends-page]");
	if (!root) return () => undefined;
	const controller = new AbortController();
	const { signal } = controller;
	root.addEventListener(
		"click",
		(event) => {
			if (!(event.target instanceof Element)) return;
			const header = event.target.closest<HTMLButtonElement>(
				".friend-accordion-header",
			);
			const accordion = header?.closest<HTMLElement>("[data-friend-accordion]");
			if (!header || !accordion) return;
			const open = !accordion.hasAttribute("data-open");
			accordion.toggleAttribute("data-open", open);
			header.setAttribute("aria-expanded", String(open));
		},
		{ signal },
	);
	for (const box of root.querySelectorAll<HTMLElement>(
		"[data-friend-avatar], [data-friend-cover]",
	)) {
		const image = box.querySelector("img");
		if (!image) continue;
		const isCover = box.hasAttribute("data-friend-cover");
		const failed = () => {
			box.classList.remove("is-loading");
			box.classList.add("is-error");
		};
		if (image.complete) {
			if (!image.naturalWidth) failed();
			else box.classList.remove("is-loading", "is-error");
			continue;
		}
		if (isCover) box.classList.add("is-loading");
		image.addEventListener("error", failed, { once: true, signal });
		image.addEventListener(
			"load",
			() => {
				box.classList.remove("is-error");
				if (isCover) void revealImageWithPixels(box, image, { signal });
			},
			{ once: true, signal },
		);
	}
	let preview: HTMLDivElement | undefined;
	if (
		window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
		root.querySelector("[data-friend-image]")
	) {
		const overlay = document.createElement("div");
		overlay.className = "friend-image-preview";
		overlay.setAttribute("aria-hidden", "true");
		const image = document.createElement("img");
		image.alt = "";
		overlay.append(image);
		document.body.append(overlay);
		preview = overlay;
		const place = (event: MouseEvent) => {
			const rect = overlay.getBoundingClientRect();
			overlay.style.left = `${Math.max(8, Math.min(event.clientX + 16, window.innerWidth - rect.width - 8))}px`;
			overlay.style.top = `${Math.max(8, Math.min(event.clientY + 16, window.innerHeight - rect.height - 8))}px`;
		};
		root.addEventListener(
			"mouseover",
			(event) => {
				if (!(event.target instanceof Element)) return;
				const card = event.target.closest<HTMLElement>("[data-friend-image]");
				if (!card?.dataset.friendImage) return;
				image.src = card.dataset.friendImage;
				overlay.classList.add("is-visible");
				place(event);
			},
			{ signal },
		);
		root.addEventListener(
			"mouseout",
			(event) => {
				if (!(event.target instanceof Element)) return;
				const card = event.target.closest("[data-friend-image]");
				if (
					!card ||
					(event.relatedTarget instanceof Node &&
						card.contains(event.relatedTarget))
				)
					return;
				overlay.classList.remove("is-visible");
			},
			{ signal },
		);
		root.addEventListener(
			"mousemove",
			(event) => {
				if (overlay.classList.contains("is-visible")) place(event);
			},
			{ signal },
		);
		image.addEventListener("load", () => overlay.classList.remove("is-error"), {
			signal,
		});
		image.addEventListener(
			"error",
			() => overlay.classList.remove("is-visible"),
			{ signal },
		);
	}
	return () => {
		controller.abort();
		preview?.remove();
		for (const overlay of root.querySelectorAll<HTMLElement>(
			"[data-image-pixel-reveal]",
		)) {
			overlay.getAnimations({ subtree: true }).forEach((animation) => {
				animation.cancel();
			});
			overlay.replaceChildren();
		}
	};
}
