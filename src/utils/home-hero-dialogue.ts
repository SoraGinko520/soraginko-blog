import type { HeroDialogueLine, HeroDialogueTopic } from "@/types/config";

const START_DEBOUNCE_MS = 200;

type ResolvedDialogueConfig = {
	speakers: { host: string; visitor: string };
	typingSpeed: number;
	autoDelay: number;
	menuTitle: string;
	intro: HeroDialogueLine[];
	topics: HeroDialogueTopic[];
};

export type HomeHeroDialogueCallbacks = {
	onReaction: (line: HeroDialogueLine) => void;
	onReset: () => void;
};

export type HomeHeroDialogueController = {
	setSceneVisible: (visible: boolean) => void;
	destroy: () => void;
};

function isDialogueLine(value: unknown): value is HeroDialogueLine {
	if (typeof value !== "object" || value === null || !("text" in value)) {
		return false;
	}
	if (typeof value.text !== "string") return false;
	if (
		"speaker" in value &&
		value.speaker !== undefined &&
		value.speaker !== "host" &&
		value.speaker !== "visitor"
	) {
		return false;
	}
	if (
		"action" in value &&
		value.action !== undefined &&
		value.action !== "greet" &&
		value.action !== "nod" &&
		value.action !== "tilt"
	) {
		return false;
	}
	return (
		!("expression" in value) ||
		value.expression === undefined ||
		value.expression === "idle" ||
		value.expression === "blink" ||
		value.expression === "smile" ||
		value.expression === "greet"
	);
}

function isDialogueTopic(value: unknown): value is HeroDialogueTopic {
	return (
		typeof value === "object" &&
		value !== null &&
		"title" in value &&
		typeof value.title === "string" &&
		"lines" in value &&
		Array.isArray(value.lines) &&
		value.lines.length > 0 &&
		value.lines.every(isDialogueLine)
	);
}

function parseConfig(root: HTMLElement): ResolvedDialogueConfig | null {
	try {
		const raw: unknown = JSON.parse(root.dataset.dialogue ?? "");
		if (
			typeof raw !== "object" ||
			raw === null ||
			!("speakers" in raw) ||
			!("intro" in raw) ||
			!("typingSpeed" in raw) ||
			!("autoDelay" in raw) ||
			!("menuTitle" in raw) ||
			!("topics" in raw) ||
			typeof raw.speakers !== "object" ||
			raw.speakers === null ||
			!("host" in raw.speakers) ||
			!("visitor" in raw.speakers) ||
			typeof raw.speakers.host !== "string" ||
			typeof raw.speakers.visitor !== "string" ||
			!Array.isArray(raw.intro) ||
			!raw.intro.every(isDialogueLine) ||
			!Array.isArray(raw.topics) ||
			!raw.topics.every(isDialogueTopic) ||
			typeof raw.menuTitle !== "string" ||
			typeof raw.autoDelay !== "number" ||
			!Number.isFinite(raw.autoDelay) ||
			raw.autoDelay < 0 ||
			typeof raw.typingSpeed !== "number" ||
			!Number.isFinite(raw.typingSpeed) ||
			raw.typingSpeed < 0
		) {
			return null;
		}
		return {
			speakers: {
				host: raw.speakers.host,
				visitor: raw.speakers.visitor,
			},
			intro: raw.intro,
			typingSpeed: raw.typingSpeed,
			autoDelay: raw.autoDelay,
			menuTitle: raw.menuTitle,
			topics: raw.topics,
		};
	} catch {
		// 静态配置无法解析时保持服务端提示与禁用按钮，不启动半完成的互动。
		return null;
	}
}

export function initHomeHeroDialogue(
	hero: HTMLElement,
	callbacks: HomeHeroDialogueCallbacks,
): HomeHeroDialogueController {
	const root = hero.querySelector<HTMLElement>("[data-hero-dialogue]");
	const config = root ? parseConfig(root) : null;
	const box = root?.querySelector<HTMLElement>("[data-dialogue-box]");
	const name = root?.querySelector<HTMLElement>("[data-dialogue-name]");
	const text = root?.querySelector<HTMLElement>("[data-dialogue-text]");
	const announcement = root?.querySelector<HTMLElement>(
		"[data-dialogue-announcement]",
	);
	const body = root?.querySelector<HTMLButtonElement>("[data-dialogue-click]");
	const menu = root?.querySelector<HTMLUListElement>("[data-dialogue-menu]");
	const autoButton = root?.querySelector<HTMLButtonElement>(
		'[data-dialogue-action="auto"]',
	);
	const backButton = root?.querySelector<HTMLButtonElement>(
		'[data-dialogue-action="back"]',
	);
	const resetButton = root?.querySelector<HTMLButtonElement>(
		'[data-dialogue-action="reset"]',
	);
	const advanceButton = root?.querySelector<HTMLButtonElement>(
		"[data-dialogue-advance]",
	);
	const hideButton = root?.querySelector<HTMLButtonElement>(
		'[data-dialogue-action="hide"]',
	);
	const restoreButton = hero.querySelector<HTMLButtonElement>(
		"[data-dialogue-restore]",
	);

	if (
		!root ||
		!config ||
		(config.intro.length === 0 && config.topics.length === 0) ||
		!box ||
		!name ||
		!text ||
		!announcement ||
		!body ||
		!menu ||
		!autoButton ||
		!backButton ||
		!resetButton ||
		!advanceButton ||
		!hideButton
	) {
		return {
			setSceneVisible: () => undefined,
			destroy: () => undefined,
		};
	}

	const abortController = new AbortController();
	const motionPreference = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	);
	let sceneVisible = false;
	let hasStarted = false;
	let mode: "intro" | "topic" | "menu" = "intro";
	let lines = config.intro;
	let lineIndex = -1;
	let lastStartTime = Number.NEGATIVE_INFINITY;
	let typeTimer: number | null = null;
	let autoTimer: number | null = null;
	let isAuto = false;
	let isTyping = false;
	let isClosed = false;

	const clearTypeTimer = (): void => {
		if (typeTimer === null) return;
		window.clearTimeout(typeTimer);
		typeTimer = null;
	};

	const clearAutoTimer = (): void => {
		if (autoTimer === null) return;
		window.clearTimeout(autoTimer);
		autoTimer = null;
	};

	const syncAvailability = (): void => {
		const available = sceneVisible && !document.hidden && !isClosed;
		root.toggleAttribute("inert", !available);
		root.setAttribute("aria-hidden", String(!available));
		body.disabled = !available || mode === "menu";
		autoButton.disabled = !available;
		resetButton.disabled = !available;
		hideButton.disabled = !available;
		if (restoreButton) {
			restoreButton.disabled = !sceneVisible || document.hidden;
			restoreButton.setAttribute("aria-expanded", String(available));
			restoreButton.setAttribute("aria-label", root.dataset.restoreLabel ?? "");
		}
		backButton.disabled =
			!available || mode === "menu" || (mode === "intro" && lineIndex <= 0);
		const ready = available && !isTyping && mode !== "menu";
		advanceButton.disabled = !ready;
		advanceButton.dataset.ready = String(ready);
		const label =
			lineIndex === lines.length - 1
				? (root.dataset.topicLabel ?? "")
				: (root.dataset.nextLabel ?? "");
		body.setAttribute("aria-label", label);
		advanceButton.setAttribute("aria-label", label);
		advanceButton.title = label;
	};

	const scheduleAutoAdvance = (): void => {
		clearAutoTimer();
		if (
			!isAuto ||
			!sceneVisible ||
			document.hidden ||
			isClosed ||
			mode === "menu"
		)
			return;
		autoTimer = window.setTimeout(() => advance(), config.autoDelay);
	};

	const completeLine = (): void => {
		clearTypeTimer();
		isTyping = false;
		box.dataset.typing = "false";
		const line = lines[lineIndex];
		syncAvailability();
		if (!line) return;
		text.textContent = line.text;
		// 可见文字逐字更新；读屏只在完成时收到整句，避免逐字播报。
		announcement.textContent = `${name.textContent}: ${line.text}`;
		scheduleAutoAdvance();
	};

	const setSpeaker = (line: HeroDialogueLine): void => {
		const speaker = line.speaker === "visitor" ? "visitor" : "host";
		name.textContent = config.speakers[speaker];
		box.dataset.speaker = speaker;
	};

	const showMenu = (): void => {
		clearTypeTimer();
		clearAutoTimer();
		isTyping = false;
		mode = "menu";
		root.dataset.dialogueMode = mode;
		box.dataset.typing = "false";
		setSpeaker({ text: config.menuTitle });
		text.textContent = config.menuTitle;
		announcement.textContent = config.menuTitle;
		menu.hidden = isClosed || config.topics.length === 0;
		const shouldMoveFocus =
			document.activeElement === body ||
			document.activeElement === advanceButton;
		syncAvailability();
		if (shouldMoveFocus)
			menu.querySelector<HTMLButtonElement>("button")?.focus({
				preventScroll: true,
			});
	};

	const playLine = (nextIndex: number): void => {
		const line = lines[nextIndex];
		if (!line) {
			showMenu();
			return;
		}
		clearTypeTimer();
		clearAutoTimer();
		lineIndex = nextIndex;
		isTyping = true;
		menu.hidden = true;
		root.dataset.dialogueMode = mode;
		setSpeaker(line);
		announcement.textContent = "";
		text.textContent = "";
		box.dataset.typing = "true";
		syncAvailability();
		callbacks.onReaction(line);

		if (motionPreference.matches || config.typingSpeed === 0) {
			completeLine();
			return;
		}

		const characters = Array.from(line.text);
		let characterIndex = 0;
		const typeNextCharacter = (): void => {
			if (!sceneVisible || document.hidden || isClosed) {
				completeLine();
				return;
			}
			text.textContent += characters[characterIndex] ?? "";
			characterIndex += 1;
			if (characterIndex >= characters.length) {
				completeLine();
				return;
			}
			typeTimer = window.setTimeout(typeNextCharacter, config.typingSpeed);
		};
		typeNextCharacter();
	};

	const advance = (): void => {
		if (!sceneVisible || document.hidden || isClosed || mode === "menu") return;
		if (isTyping) {
			completeLine();
			return;
		}
		if (lineIndex < lines.length - 1) playLine(lineIndex + 1);
		else showMenu();
	};

	const advanceByClick = (): void => {
		const now = performance.now();
		if (now - lastStartTime < START_DEBOUNCE_MS) return;
		lastStartTime = now;
		advance();
	};

	const reset = (): void => {
		if (!sceneVisible || document.hidden || isClosed) return;
		clearTypeTimer();
		clearAutoTimer();
		isAuto = false;
		autoButton.setAttribute("aria-pressed", "false");
		mode = "intro";
		lines = config.intro;
		lastStartTime = Number.NEGATIVE_INFINITY;
		callbacks.onReset();
		playLine(0);
	};

	const back = (): void => {
		if (!sceneVisible || document.hidden || isClosed || mode === "menu") return;
		if (lineIndex > 0) playLine(lineIndex - 1);
		else if (mode === "topic") showMenu();
	};

	const close = (): void => {
		if (!sceneVisible || document.hidden || isClosed) return;
		isClosed = true;
		clearAutoTimer();
		// 收起时补全正在输出的句子，恢复后不丢字，也不积压旧打字任务。
		if (isTyping) completeLine();
		else clearTypeTimer();
		root.dataset.hidden = "true";
		menu.hidden = true;
		restoreButton?.focus({ preventScroll: true });
		syncAvailability();
	};

	const restore = (): void => {
		if (!sceneVisible || document.hidden || !isClosed) return;
		isClosed = false;
		root.dataset.hidden = "false";
		menu.hidden = mode !== "menu" || config.topics.length === 0;
		syncAvailability();
		if (mode === "menu")
			menu
				.querySelector<HTMLButtonElement>("button")
				?.focus({ preventScroll: true });
		else body.focus({ preventScroll: true });
		scheduleAutoAdvance();
	};

	body.addEventListener("click", advanceByClick, {
		signal: abortController.signal,
	});
	advanceButton.addEventListener("click", advanceByClick, {
		signal: abortController.signal,
	});
	backButton.addEventListener("click", back, {
		signal: abortController.signal,
	});
	autoButton.addEventListener(
		"click",
		() => {
			isAuto = !isAuto;
			autoButton.setAttribute("aria-pressed", String(isAuto));
			if (isAuto && !isTyping) scheduleAutoAdvance();
			else if (!isAuto) clearAutoTimer();
		},
		{
			signal: abortController.signal,
		},
	);
	resetButton.addEventListener("click", reset, {
		signal: abortController.signal,
	});
	hideButton.addEventListener("click", close, {
		signal: abortController.signal,
	});
	restoreButton?.addEventListener("click", restore, {
		signal: abortController.signal,
	});
	root.addEventListener(
		"keydown",
		(event) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			close();
		},
		{ signal: abortController.signal },
	);
	menu.addEventListener(
		"click",
		(event) => {
			if (
				!sceneVisible ||
				document.hidden ||
				isClosed ||
				!(event.target instanceof Element)
			)
				return;
			const button = event.target.closest<HTMLButtonElement>(
				"[data-dialogue-topic]",
			);
			if (!button) return;
			const topic =
				config.topics[Number.parseInt(button.dataset.dialogueTopic ?? "", 10)];
			if (!topic) return;
			mode = "topic";
			lines = topic.lines;
			playLine(0);
			body.focus({ preventScroll: true });
		},
		{ signal: abortController.signal },
	);
	document.addEventListener(
		"visibilitychange",
		() => {
			if (document.hidden) {
				clearAutoTimer();
				if (isTyping) completeLine();
			} else if (!isTyping) scheduleAutoAdvance();
			syncAvailability();
		},
		{ signal: abortController.signal },
	);
	motionPreference.addEventListener(
		"change",
		() => {
			if (motionPreference.matches && isTyping) completeLine();
		},
		{ signal: abortController.signal },
	);

	root.dataset.dialogueReady = "true";
	box.dataset.typing = "false";
	syncAvailability();

	return {
		setSceneVisible(visible): void {
			if (sceneVisible === visible) return;
			sceneVisible = visible;
			root.dataset.sceneVisible = String(visible);
			if (!visible) {
				clearAutoTimer();
				if (isTyping) completeLine();
				const activeElement = document.activeElement;
				if (
					activeElement instanceof HTMLElement &&
					root.contains(activeElement)
				) {
					activeElement.blur();
				}
			}
			syncAvailability();
			if (visible && !isClosed && !hasStarted) {
				hasStarted = true;
				playLine(0);
			} else if (visible && !isClosed && !isTyping) scheduleAutoAdvance();
		},
		destroy(): void {
			clearTypeTimer();
			clearAutoTimer();
			abortController.abort();
			box.dataset.typing = "false";
			body.disabled = true;
			autoButton.disabled = true;
			backButton.disabled = true;
			advanceButton.disabled = true;
			resetButton.disabled = true;
			hideButton.disabled = true;
			if (restoreButton) {
				restoreButton.disabled = true;
				restoreButton.setAttribute("aria-expanded", "false");
			}
			root.setAttribute("inert", "");
			root.setAttribute("aria-hidden", "true");
			delete root.dataset.dialogueReady;
		},
	};
}
