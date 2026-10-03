/** 书架筛选只增强静态内容；没有 JS 时仍能阅读全部书籍。 */
export function initLifePage(): () => void {
	const root = document.querySelector<HTMLElement>("[data-life-page]");
	if (!root) return () => undefined;
	const abortController = new AbortController();
	const filters = root.querySelectorAll<HTMLElement>(
		"[data-life-book-filters]",
	);
	const books = [
		...root.querySelectorAll<HTMLElement>("[data-life-book-status]"),
	];
	const buttons = [
		...root.querySelectorAll<HTMLButtonElement>("[data-life-book-filter]"),
	];
	const empty = root.querySelector<HTMLElement>("[data-life-books-empty]");
	const topicButtons = [
		...root.querySelectorAll<HTMLButtonElement>("[data-life-book-topic]"),
	];
	let activeBookStatus = "all";
	let activeBookTopic = "all";
	const filterBooks = () => {
		for (const book of books) {
			const matchesStatus =
				activeBookStatus === "all" ||
				book.dataset.lifeBookStatus === activeBookStatus;
			const matchesTopic =
				activeBookTopic === "all" ||
				book.dataset.lifeBookTopics
					?.split(" ")
					.includes(encodeURIComponent(activeBookTopic));
			book.hidden = !matchesStatus || !matchesTopic;
		}
		if (empty) empty.hidden = books.some((book) => !book.hidden);
	};
	for (const button of buttons) {
		button.addEventListener(
			"click",
			() => {
				activeBookStatus = button.dataset.lifeBookFilter || "all";
				for (const item of buttons)
					item.setAttribute("aria-pressed", String(item === button));
				filterBooks();
			},
			{ signal: abortController.signal },
		);
	}
	for (const button of topicButtons) {
		button.addEventListener(
			"click",
			() => {
				activeBookTopic = button.dataset.lifeBookTopic || "all";
				for (const item of topicButtons)
					item.setAttribute("aria-pressed", String(item === button));
				filterBooks();
			},
			{ signal: abortController.signal },
		);
	}
	for (const filter of filters) filter.hidden = false;
	const animeRoot = root.querySelector<HTMLElement>("[data-life-anime]");
	const animeControls = animeRoot?.querySelector<HTMLElement>(
		"[data-life-anime-controls]",
	);
	const search = animeRoot?.querySelector<HTMLInputElement>(
		"[data-life-anime-search]",
	);
	const animeCards = [
		...(animeRoot?.querySelectorAll<HTMLElement>("[data-life-anime-kind]") ??
			[]),
	];
	const animeButtons = [
		...(animeRoot?.querySelectorAll<HTMLButtonElement>(
			"[data-life-anime-filter]",
		) ?? []),
	];
	const animeEmpty = animeRoot?.querySelector<HTMLElement>(
		"[data-life-anime-empty]",
	);
	let activeKind = "all";
	const filterAnime = () => {
		const query = search?.value.trim().toLocaleLowerCase() || "";
		for (const card of animeCards) {
			card.hidden =
				(activeKind !== "all" && card.dataset.lifeAnimeKind !== activeKind) ||
				!(card.dataset.lifeAnimeTitle || "")
					.toLocaleLowerCase()
					.includes(query);
		}
		if (animeEmpty) animeEmpty.hidden = animeCards.some((card) => !card.hidden);
	};
	search?.addEventListener("input", filterAnime, {
		signal: abortController.signal,
	});
	for (const button of animeButtons) {
		button.addEventListener(
			"click",
			() => {
				activeKind = button.dataset.lifeAnimeFilter || "all";
				for (const item of animeButtons)
					item.setAttribute("aria-pressed", String(item === button));
				filterAnime();
			},
			{ signal: abortController.signal },
		);
	}
	if (animeControls) animeControls.hidden = false;
	return () => abortController.abort();
}
