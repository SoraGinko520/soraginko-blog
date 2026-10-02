import { type ProjectStatus, projectStatuses } from "@/types/projects";

/** 纯 DOM 筛选，不请求 GitHub；由页面级 Swup 孤岛负责挂载和卸载。 */
export function createProjectsController(root: HTMLElement): () => void {
	const input = root.querySelector<HTMLInputElement>(
		"[data-project-search-input]",
	);
	const filters = root.querySelector<HTMLElement>("[data-project-filters]");
	const buttons = root.querySelectorAll<HTMLButtonElement>(
		"[data-project-filter]",
	);
	const cards = root.querySelectorAll<HTMLElement>("[data-project-card]");
	const count = root.querySelector<HTMLElement>("[data-project-count]");
	const empty = root.querySelector<HTMLElement>("[data-project-no-results]");
	if (!input || !filters) return () => {};

	const events = new AbortController();
	let selected: ProjectStatus | "all" = "all";
	const update = (): void => {
		const query = input.value.trim().toLocaleLowerCase();
		let visibleCount = 0;
		for (const card of cards) {
			const matches =
				(selected === "all" || card.dataset.projectStatus === selected) &&
				(card.dataset.projectSearch || "").includes(query);
			card.hidden = !matches;
			if (matches) visibleCount += 1;
		}
		for (const button of buttons) {
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.projectFilter === selected),
			);
		}
		if (count)
			count.textContent = (count.dataset.projectCount || "").replace(
				"{count}",
				String(visibleCount),
			);
		if (empty) empty.hidden = visibleCount > 0;
	};
	input.addEventListener("input", update, { signal: events.signal });
	filters.addEventListener(
		"click",
		(event) => {
			if (!(event.target instanceof Element)) return;
			const button = event.target.closest<HTMLButtonElement>(
				"[data-project-filter]",
			);
			if (!button || !filters.contains(button)) return;
			const status = button.dataset.projectFilter;
			if (status === "all") selected = "all";
			else {
				const matched = projectStatuses.find(
					(candidate) => candidate === status,
				);
				if (!matched) return;
				selected = matched;
			}
			update();
		},
		{ signal: events.signal },
	);
	root
		.querySelectorAll<HTMLElement>("[data-project-enhancement]")
		.forEach((control) => {
			control.hidden = false;
		});
	update();
	return () => events.abort();
}
