import dayjs from "dayjs";
import type {
	FcircleDateGroup,
	FcircleDateOptions,
	FcircleItem,
	FcircleStats,
	FcircleView,
} from "@/types/fcircle";

const MILLISECONDS_PER_DAY = 86_400_000;

/** 自然日按站点时区取值，避免构建服务器与访问者所在时区改变日期分组。 */
function dateKeyAt(date: Date, timeZone: string): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const part = (type: string): string =>
		parts.find((item) => item.type === type)?.value ?? "";
	return `${part("year")}-${part("month")}-${part("day")}`;
}

function dayIndex(dateKey: string): number {
	const [year, month, day] = dateKey.split("-").map(Number);
	return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
}

function dateLabel(
	dateKey: string,
	todayKey: string,
	options: FcircleDateOptions,
): string {
	const elapsed = dayIndex(todayKey) - dayIndex(dateKey);
	if (elapsed === 0) return options.today;
	if (elapsed === 1) return options.yesterday;
	if (elapsed === 2) return options.dayBeforeYesterday;
	const [year, month, day] = dateKey.split("-").map(Number);
	// dateKey 已是站点自然日；只格式化这三个数字，不再二次应用时区偏移。
	return new Intl.DateTimeFormat(options.locale, {
		timeZone: "UTC",
		year: dateKey.slice(0, 4) === todayKey.slice(0, 4) ? undefined : "numeric",
		month: "long",
		day: "numeric",
	}).format(new Date(Date.UTC(year, month - 1, day)));
}

export function createFcircleDateGroups(
	items: readonly FcircleItem[],
	options: FcircleDateOptions,
	now: Date = dayjs().toDate(),
): FcircleDateGroup[] {
	const todayKey = dateKeyAt(now, options.timeZone);
	const groups = new Map<string, FcircleDateGroup>();
	const formatter = new Intl.DateTimeFormat(options.locale, {
		timeZone: options.timeZone,
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	for (const item of items) {
		const date = dayjs(item.publishedAt).toDate();
		const dateKey = dateKeyAt(date, options.timeZone);
		let group = groups.get(dateKey);
		if (!group) {
			group = {
				dateKey,
				label: dateLabel(dateKey, todayKey, options),
				fullDate: formatter.format(date),
				items: [],
			};
			groups.set(dateKey, group);
		}
		group.items.push(item);
	}
	return [...groups.values()].sort((a, b) =>
		b.dateKey.localeCompare(a.dateKey),
	);
}

/** “本周”是站点时区的周一至当前时刻，不是滚动七天。 */
export function getFcircleStats(
	items: readonly Pick<FcircleItem, "publishedAt" | "friendUrl">[],
	timeZone: string,
	now: Date = dayjs().toDate(),
): FcircleStats {
	const todayKey = dateKeyAt(now, timeZone);
	const todayIndex = dayIndex(todayKey);
	const weekStart = todayIndex - ((dayjs(todayKey).day() + 6) % 7);
	let todayCount = 0;
	let weekCount = 0;
	const sites = new Set<string>();
	for (const item of items) {
		const published = dayjs(item.publishedAt);
		const index = dayIndex(dateKeyAt(published.toDate(), timeZone));
		if (published.valueOf() <= now.getTime()) {
			if (index === todayIndex) todayCount++;
			if (index >= weekStart && index <= todayIndex) weekCount++;
		}
		sites.add(item.friendUrl);
	}
	return {
		todayCount,
		weekCount,
		articleCount: items.length,
		siteCount: sites.size,
	};
}

function readDateOptions(root: HTMLElement): FcircleDateOptions | null {
	try {
		const options: unknown = JSON.parse(root.dataset.fcircleDates || "null");
		if (
			typeof options !== "object" ||
			options === null ||
			!("locale" in options) ||
			typeof options.locale !== "string" ||
			!("timeZone" in options) ||
			typeof options.timeZone !== "string" ||
			!("today" in options) ||
			typeof options.today !== "string" ||
			!("yesterday" in options) ||
			typeof options.yesterday !== "string" ||
			!("dayBeforeYesterday" in options) ||
			typeof options.dayBeforeYesterday !== "string"
		) {
			return null;
		}
		return {
			locale: options.locale,
			timeZone: options.timeZone,
			today: options.today,
			yesterday: options.yesterday,
			dayBeforeYesterday: options.dayBeforeYesterday,
		};
	} catch {
		// 配置不可读时仍保留服务端时间线，不隐藏真实内容。
		return null;
	}
}

export function initFcirclePage(): () => void {
	const root = document.querySelector<HTMLElement>("[data-fcircle]");
	if (!root) return () => undefined;
	const options = readDateOptions(root);
	if (!options) return () => undefined;
	const abortController = new AbortController();
	const { signal } = abortController;
	const switcher = root.querySelector<HTMLElement>("[data-fcircle-switcher]");
	const buttons = [
		...root.querySelectorAll<HTMLButtonElement>("[data-fcircle-view-button]"),
	];
	const panel = root.querySelector<HTMLElement>("[data-fcircle-panel]");
	const statsItems = [
		...root.querySelectorAll<HTMLElement>("[data-fcircle-item]"),
	]
		.map((item) => ({
			publishedAt: item.dataset.fcirclePublished || "",
			friendUrl: item.dataset.fcircleSite || "",
		}))
		.filter((item) => dayjs(item.publishedAt).isValid());

	const refreshDates = (): void => {
		const now = dayjs().toDate();
		const todayKey = dateKeyAt(now, options.timeZone);
		root
			.querySelectorAll<HTMLElement>("[data-fcircle-date-label]")
			.forEach((label) => {
				const dateKey = label.dataset.fcircleDateLabel;
				if (dateKey) label.textContent = dateLabel(dateKey, todayKey, options);
			});
		const stats = getFcircleStats(statsItems, options.timeZone, now);
		for (const [key, value] of Object.entries(stats)) {
			const node = root.querySelector<HTMLElement>(
				`[data-fcircle-stat="${key}"]`,
			);
			if (node) node.textContent = String(value);
		}
	};
	const applyView = (view: FcircleView): void => {
		root.dataset.fcircleView = view;
		for (const button of buttons) {
			const selected = button.dataset.fcircleViewButton === view;
			button.setAttribute("aria-selected", String(selected));
			button.tabIndex = selected ? 0 : -1;
			if (selected) panel?.setAttribute("aria-labelledby", button.id);
		}
	};
	for (const [index, button] of buttons.entries()) {
		button.addEventListener(
			"click",
			() => {
				const view = button.dataset.fcircleViewButton;
				if (view === "timeline" || view === "grid") applyView(view);
			},
			{ signal },
		);
		button.addEventListener(
			"keydown",
			(event) => {
				let nextIndex: number;
				if (event.key === "ArrowRight")
					nextIndex = (index + 1) % buttons.length;
				else if (event.key === "ArrowLeft")
					nextIndex = (index - 1 + buttons.length) % buttons.length;
				else if (event.key === "Home") nextIndex = 0;
				else if (event.key === "End") nextIndex = buttons.length - 1;
				else return;
				event.preventDefault();
				buttons[nextIndex]?.click();
				buttons[nextIndex]?.focus();
			},
			{ signal },
		);
	}
	root
		.querySelectorAll<HTMLImageElement>("[data-fcircle-avatar]")
		.forEach((image) => {
			const markError = (): void =>
				image.parentElement?.classList.add("is-error");
			if (image.complete && image.naturalWidth === 0) markError();
			image.addEventListener("error", markError, { signal, once: true });
		});
	window.addEventListener("focus", refreshDates, { signal });
	document.addEventListener(
		"visibilitychange",
		() => {
			if (!document.hidden) refreshDates();
		},
		{ signal },
	);
	refreshDates();
	applyView("timeline");
	if (switcher) switcher.hidden = false;
	return () => abortController.abort();
}
