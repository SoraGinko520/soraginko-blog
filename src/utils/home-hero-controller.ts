import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
	HeroArtworkConfig,
	HeroDialogueLine,
	HeroMosaicConfig,
} from "@/types/config";
import { initHomeHeroDialogue } from "@/utils/home-hero-dialogue";
import { createFlyText, type FlyTextHandle } from "@/utils/home-hero-fly-text";
import { getHeroPinEndDistance } from "@/utils/home-hero-motion";
import { initHomeHeroRain } from "@/utils/home-hero-rain";
import { initHomeHeroSticker } from "@/utils/home-hero-sticker";
import { navigateToPage } from "@/utils/navigation-utils";
import {
	cancelScrollTriggerRefresh,
	requestScrollTriggerRefresh,
} from "@/utils/scroll-trigger-refresh";

gsap.registerPlugin(ScrollTrigger);

const RAIN_ACTIVATE_TIME = 0.99;
const DIALOGUE_REVEAL_TIME = 1.08;
const DIALOGUE_REVEAL_DURATION = 0.11;
const DIALOGUE_REVEAL_END_TIME =
	DIALOGUE_REVEAL_TIME + DIALOGUE_REVEAL_DURATION;
const QUICK_ACTIONS_REVEAL_TIME = 1.14;
const INTERACTION_HOLD_START = 1.31;
const HERO_OPENING = {
	duration: 1.55,
	titleDuration: 0.65,
	titleDelay: 1.25,
	occupationDelay: 1.37,
	tilesDelay: 1.05,
	tilesDuration: 1.25,
	ease: "expo.out",
	interactionDelay: 3.3,
};
// 全幅插画只在预设互动时轻微回应；待机动作由 Q 版控制器承担。
const HERO_ARTWORK_MOTION = {
	maxTranslation: 6,
	greetingTranslation: 4,
	nodTranslation: 4,
	reactionEnter: 0.38,
	reactionReturn: 0.82,
};
const HERO_SIGNATURE_MOTION = {
	revealDuration: 1.4,
	reactionDuration: 1.1,
};
let initialReloadHandled = false;

type HeroSceneController = {
	setActive: (active: boolean) => void;
	playReaction: (line: HeroDialogueLine) => void;
	resetReaction: () => void;
	destroy: () => void;
};

function getHeroArtworkRect(hero: HTMLElement, artwork: HeroArtworkConfig) {
	const viewWidth = hero.clientWidth;
	const viewHeight = hero.clientHeight;
	const scale = Math.min(
		viewWidth / artwork.width,
		viewHeight / artwork.height,
		1,
	);
	const width = artwork.width * scale;
	const height = artwork.height * scale;
	return {
		x: (viewWidth - width) * artwork.positionX,
		y: (viewHeight - height) * artwork.positionY,
		width,
		height,
	};
}

/**
 * 静态原画与碎片终点共用 scale-down 构图，不再放大裁切人物或创建整屏 GPU 资源。
 * 回应仅使用临时 transform；同步略微放大避免位移露边，结束后恢复原始构图。
 */
function initHeroArtwork(hero: HTMLElement): HeroSceneController {
	const foreground = hero.querySelector<HTMLElement>("[data-hero-foreground]");
	if (!foreground)
		return {
			setActive: () => undefined,
			playReaction: () => undefined,
			resetReaction: () => undefined,
			destroy: () => undefined,
		};
	let active = false;
	let disposed = false;
	let reaction: gsap.core.Timeline | null = null;
	let reactionScale = 1;
	const measureBounds = () => {
		const width = hero.clientWidth;
		const height = hero.clientHeight;
		reactionScale =
			1 +
			(HERO_ARTWORK_MOTION.maxTranslation * 2) /
				Math.max(1, Math.min(width, height));
	};
	const clearTransform = () => {
		gsap.set(foreground, {
			clearProps: "transform,transformOrigin,willChange",
		});
	};
	const resetReaction = () => {
		if (!reaction) return;
		reaction.kill();
		reaction = null;
		clearTransform();
	};
	const observer = new ResizeObserver(() => {
		measureBounds();
		resetReaction();
	});
	measureBounds();
	observer.observe(hero);

	return {
		setActive: (visible) => {
			active = visible;
			if (!visible) resetReaction();
		},
		playReaction: (line) => {
			resetReaction();
			if (!active || disposed || document.hidden) return;
			const x =
				line.action === "tilt"
					? -HERO_ARTWORK_MOTION.maxTranslation
					: line.action === "nod"
						? 0
						: HERO_ARTWORK_MOTION.greetingTranslation;
			const y = line.action === "nod" ? -HERO_ARTWORK_MOTION.nodTranslation : 0;
			gsap.set(foreground, {
				willChange: "transform",
				transformOrigin: "50% 50%",
			});
			reaction = gsap.timeline({
				defaults: { ease: "power2.inOut" },
				onComplete: () => {
					reaction = null;
					clearTransform();
				},
			});
			reaction
				.to(foreground, {
					x,
					y,
					scale: reactionScale,
					duration: HERO_ARTWORK_MOTION.reactionEnter,
				})
				.to(foreground, {
					x: 0,
					y: 0,
					scale: 1,
					duration: HERO_ARTWORK_MOTION.reactionReturn,
				});
		},
		resetReaction,
		destroy: () => {
			disposed = true;
			active = false;
			resetReaction();
			observer.disconnect();
		},
	};
}

/**
 * navigation.type 描述的是「当前 document 是怎么来的」，Swup 导航不会改它：
 * 在别的页面按了 F5，之后再跳进首页，这里读到的仍然是 "reload"。而本模块恰好是在
 * 「进首页」那次导航里才第一次执行，于是 hero 的首次挂载会误判成「刚刷新了首页」，
 * 多做一轮 scrollTo(0,0) + progress(0) + ScrollTrigger.refresh()，正好落在
 * 影像层 pin 刚插入、首页高度还在变的时候，第二幕的滚动进度因此对不上。
 * 用 navigation.name（document 首次加载的 URL）与当前路径比对即可排除这种情况。
 */
function isInitialDocumentPath(navigationName: string) {
	try {
		return (
			new URL(navigationName, location.href).pathname === location.pathname
		);
	} catch {
		return false;
	}
}

function resetHeroScrollOnReload() {
	if (initialReloadHandled) return false;
	initialReloadHandled = true;
	const navigation = performance.getEntriesByType("navigation")[0] as
		| PerformanceNavigationTiming
		| undefined;
	if (navigation?.type !== "reload") return false;
	if (!isInitialDocumentPath(navigation.name)) return false;

	history.scrollRestoration = "manual";
	ScrollTrigger.clearScrollMemory("manual");
	window.scrollTo(0, 0);
	return true;
}

type HeroRuntimeConfig = {
	mosaic: HeroMosaicConfig;
	artwork: HeroArtworkConfig;
	rain: {
		enabled?: boolean;
		intensity?: number;
		color?: string;
	};
};

type TileState = {
	element: HTMLElement;
	row: number;
	column: number;
	order: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
	scale: number;
	blur: number;
	initiallyVisible: boolean;
};

type TileTransform = {
	x: number;
	y: number;
	rotation: number;
	scaleX: number;
	scaleY: number;
	blur: number;
};

type TileEntranceTransform = TileTransform;
type TileIdleTransform = TileTransform;

function parseRuntimeConfig(hero: HTMLElement): HeroRuntimeConfig | null {
	try {
		return JSON.parse(hero.dataset.heroConfig ?? "") as HeroRuntimeConfig;
	} catch {
		return null;
	}
}

function readNumber(element: HTMLElement, key: string, fallback: number) {
	const value = Number.parseFloat(element.dataset[key] ?? "");
	return Number.isFinite(value) ? value : fallback;
}

function getTileStates(hero: HTMLElement): TileState[] {
	return Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-tile]")).map(
		(element) => ({
			element,
			row: readNumber(element, "row", 0),
			column: readNumber(element, "column", 0),
			order: readNumber(element, "order", 0),
			offsetX: readNumber(element, "offsetX", 0),
			offsetY: readNumber(element, "offsetY", 0),
			rotation: readNumber(element, "rotation", 0),
			scale: readNumber(element, "scale", 1),
			blur: readNumber(element, "blur", 0),
			initiallyVisible: element.dataset.idleVisible === "true",
		}),
	);
}

function createSeededRandom(seed: number) {
	let value = seed >>> 0;
	return () => {
		value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
		return value / 4294967296;
	};
}

function bindQuickActions(hero: HTMLElement, abortController: AbortController) {
	hero.addEventListener(
		"click",
		(event) => {
			const target = (event.target as Element).closest<HTMLElement>(
				"[data-hero-action]",
			);
			if (!target) return;
			const href = target.dataset.heroActionHref;
			if (!href) return;
			event.preventDefault();
			navigateToPage(href);
		},
		{ signal: abortController.signal },
	);
}

/**
 * 摘掉首页的 motion-pending 状态类。
 * 这个类在 index.astro 上静态渲染，CSS 会按住 identity 与 contact 不显示，
 * 所以 mountHomeHero 的每条返回路径都必须走到这里，包括提前 return 的分支。
 */
function clearMotionPending() {
	document
		.querySelector(".home-page--motion-pending")
		?.classList.remove("home-page--motion-pending");
}

function setReducedMotionState(hero: HTMLElement) {
	hero.dataset.reducedMotion = "true";
	hero.dataset.signaturePaused = "true";
	hero.querySelectorAll<HTMLElement>("[data-hero-action]").forEach((action) => {
		action.tabIndex = 0;
		action.setAttribute("aria-hidden", "false");
	});
	gsap.set(
		hero.querySelectorAll(
			"[data-hero-title], [data-hero-contact], [data-hero-backdrop], [data-hero-action], .home-hero__title > span:first-child, .home-hero__occupation > span, .home-hero__name-badge, .home-hero__contact-platform, .home-hero__contact-handle",
		),
		{
			autoAlpha: 1,
			y: 0,
			yPercent: 0,
			scale: 1,
			skewY: 0,
		},
	);
	clearMotionPending();
}

export function mountHomeHero() {
	const hero = document.querySelector<HTMLElement>("[data-home-hero]");
	if (!hero || hero.dataset.heroMounted === "true") return () => undefined;

	// 移动端首页由 HomeMobile 渲染，桌面 Hero 隐藏时跳过挂载（马赛克/雨/对话框等）
	if (
		document.getElementById("home-mobile") &&
		window.matchMedia("(max-width: 768px)").matches
	) {
		clearMotionPending();
		return () => undefined;
	}

	const config = parseRuntimeConfig(hero);
	// 配置读不出来时也要摘掉 motion-pending，否则 identity / contact 会被 CSS 一直按住
	if (!config) {
		clearMotionPending();
		return () => undefined;
	}
	const previousScrollRestoration = history.scrollRestoration;
	const resetAfterReload = resetHeroScrollOnReload();

	hero.dataset.heroMounted = "true";
	hero.dataset.signaturePaused = "true";
	// 本次挂载是否已被拆掉。document.fonts.ready 这类异步回调不能只看
	// hero.dataset.heroMounted —— 那个标记会被下一次挂载重新写成 "true"，
	// 上一次挂载的回调于是照样往下走，把 contact 拆成两套字符节点。
	let disposed = false;
	let reloadFrame = 0;
	const abortController = new AbortController();
	const reducedMotionQuery = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	);
	const mobileQuery = window.matchMedia("(max-width: 768px)");
	const sticker = initHomeHeroSticker(hero);
	const rain = initHomeHeroRain(hero, config.rain);
	const artwork = initHeroArtwork(hero);
	const dialogue = initHomeHeroDialogue(hero, {
		onReaction: (line) => {
			sticker.playReaction(line);
			if (!reducedMotionQuery.matches) artwork.playReaction(line);
			playContactReaction();
		},
		onReset: () => {
			sticker.reset();
			artwork.resetReaction();
			stopContactReaction();
		},
	});
	const title = hero.querySelector<HTMLElement>("[data-hero-title]");
	const opening = hero.querySelector<HTMLElement>("[data-hero-opening]");
	const contact = hero.querySelector<HTMLElement>("[data-hero-contact]");
	const mosaic = hero.querySelector<HTMLElement>("[data-hero-mosaic]");
	const mosaicComplete = hero.querySelector<HTMLElement>(
		"[data-hero-mosaic-complete]",
	);
	const backdrop = hero.querySelector<HTMLElement>("[data-hero-backdrop]");
	const dialogueRoot = hero.querySelector<HTMLElement>("[data-hero-dialogue]");
	const quickActions = Array.from(
		hero.querySelectorAll<HTMLElement>("[data-hero-action]"),
	);
	const tiles = getTileStates(hero);
	let timeline: ReturnType<typeof gsap.timeline> | null = null;
	let heroScrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
	let scrollDriver: ReturnType<typeof gsap.to> | null = null;
	let idleTimer = 0;
	let idleTween: ReturnType<typeof gsap.timeline> | null = null;
	let tilesIntroTimeline: ReturnType<typeof gsap.timeline> | null = null;
	let textIntroTimeline: ReturnType<typeof gsap.timeline> | null = null;
	let openingTimeline: ReturnType<typeof gsap.timeline> | null = null;
	let interactionReady = false;
	let tilesIntroDone = false;
	let flyHandles: FlyTextHandle[] = [];
	let contactScatterTimeline: ReturnType<typeof gsap.timeline> | null = null;
	let contactReaction: gsap.core.Timeline | null = null;
	let flyLayoutTimer = 0;
	let activeTiles = new Set(
		tiles.filter((tile) => tile.initiallyVisible).map((tile) => tile.element),
	);
	const random = createSeededRandom(config.mosaic.seed ^ 0x9e3779b9);

	bindQuickActions(hero, abortController);
	// JavaScript 不可用时保留 SSR 待机；正常开场先按住交互区。
	if (dialogueRoot && !reducedMotionQuery.matches)
		gsap.set(dialogueRoot, { autoAlpha: 0 });

	function stopContactReaction(): void {
		if (!contactReaction) return;
		contactReaction.kill();
		contactReaction = null;
		for (const handle of flyHandles) handle.setNatural();
		timeline?.render(timeline.time(), true, true);
	}

	function playContactReaction(): void {
		// 字体加载晚于开场时，也必须先交出同一批字符的写入权。
		textIntroTimeline?.progress(1).kill();
		textIntroTimeline = null;
		stopContactReaction();
		const progress = timeline?.totalProgress() ?? 0;
		const time = timeline?.time() ?? 0;
		if (
			reducedMotionQuery.matches ||
			document.hidden ||
			(progress > 0.002 && time < DIALOGUE_REVEAL_TIME)
		)
			return;
		contactReaction = gsap.timeline({
			onComplete: () => {
				contactReaction = null;
			},
		});
		for (const handle of flyHandles) {
			const wave = handle.buildReaction(HERO_SIGNATURE_MOTION.reactionDuration);
			if (wave) contactReaction.add(wave, 0);
		}
	}

	const stopIdleRotation = () => {
		window.clearInterval(idleTimer);
		idleTimer = 0;
		idleTween?.kill();
		idleTween = null;
	};

	const startIdleRotation = () => {
		if (
			idleTimer ||
			reducedMotionQuery.matches ||
			!heroInView ||
			document.hidden ||
			mosaic?.style.visibility === "hidden"
		)
			return;
		idleTimer = window.setInterval(() => {
			const visible = tiles.filter((tile) => activeTiles.has(tile.element));
			const hidden = tiles.filter((tile) => !activeTiles.has(tile.element));
			if (visible.length === 0 || hidden.length === 0) return;
			const leaving = visible[Math.floor(random() * visible.length)];
			const entering = hidden[Math.floor(random() * hidden.length)];
			const enteringTransform = getTileIdleTransform(entering);
			activeTiles.delete(leaving.element);
			activeTiles.add(entering.element);
			idleTween?.kill();
			idleTween = gsap.timeline();
			idleTween.to(
				leaving.element,
				{
					autoAlpha: 0,
					duration: 0.38,
					ease: "power2.inOut",
				},
				0,
			);
			idleTween.fromTo(
				entering.element,
				{
					x: enteringTransform.x,
					y: enteringTransform.y,
					rotation: enteringTransform.rotation,
					scaleX: enteringTransform.scaleX * 0.88,
					scaleY: enteringTransform.scaleY * 0.88,
					filter: `blur(${enteringTransform.blur}px)`,
					autoAlpha: 0,
				},
				{
					autoAlpha: 1,
					scaleX: enteringTransform.scaleX,
					scaleY: enteringTransform.scaleY,
					duration: 0.48,
					ease: "power3.out",
				},
				0.12,
			);
		}, config.mosaic.idleInterval);
	};

	const resetIdleTiles = () => {
		activeTiles = new Set(
			tiles.filter((tile) => tile.initiallyVisible).map((tile) => tile.element),
		);
		tiles.forEach((tile) => {
			const transform = tile.initiallyVisible
				? getTileInitialTransform(tile)
				: getTileEntranceTransform(tile);
			gsap.set(tile.element, {
				x: transform.x,
				y: transform.y,
				rotation: transform.rotation,
				scaleX: transform.scaleX,
				scaleY: transform.scaleY,
				filter: `blur(${transform.blur}px)`,
				autoAlpha: tile.initiallyVisible ? 1 : 0,
			});
		});
	};

	// 用户开始滚动时立即完成进行中的入场动画，交由 scrub 时间线接管
	const completePendingIntros = () => {
		openingTimeline?.progress(1).kill();
		openingTimeline = null;
		interactionReady = true;
		if (tilesIntroTimeline) {
			const intro = tilesIntroTimeline;
			intro.progress(1).kill();
			tilesIntroTimeline = null;
		}
		if (textIntroTimeline) {
			const intro = textIntroTimeline;
			textIntroTimeline = null;
			intro.progress(1).kill();
		}
	};

	/**
	 * 雨的激活条件原本只有下界（时间线过了 RAIN_ACTIVATE_TIME 就一直为真），
	 * 于是滚过首屏之后 canvas 的 rAF 仍在每帧整屏清屏重绘，白白和下方的
	 * 影像层抢主线程。这里补一个视口闸门：hero 离开视口即停，回来再恢复。
	 */
	let heroInView = true;
	let rainWanted = false;
	let interactionVisible = false;
	const syncInteraction = () => {
		const progress = timeline?.totalProgress() ?? 0;
		const time = progress * (timeline?.duration() ?? 1);
		const visible =
			interactionReady &&
			(reducedMotionQuery.matches ||
				hero.dataset.reducedMotion === "true" ||
				((!contact || flyHandles.length > 0) && !textIntroTimeline)) &&
			heroInView &&
			!document.hidden &&
			!mobileQuery.matches &&
			(progress <= 0.002 || time >= DIALOGUE_REVEAL_TIME);
		const signaturePaused = String(!visible || reducedMotionQuery.matches);
		if (hero.dataset.signaturePaused !== signaturePaused)
			hero.dataset.signaturePaused = signaturePaused;
		// 晴空首屏已关闭雨效，人物回应不能依赖雨层的激活时间。
		artwork.setActive(visible && !reducedMotionQuery.matches);
		if (visible === interactionVisible) return;
		interactionVisible = visible;
		// 对话首次显示会立即触发角色回应，先启用小人以免丢掉第一段动作。
		sticker.setSceneVisible(visible);
		dialogue.setSceneVisible(visible);
		hero.dataset.layerActive = String(visible);
		if (dialogueRoot)
			gsap.set(dialogueRoot, { autoAlpha: visible ? 1 : 0, y: 0 });
		if (!visible) stopContactReaction();
	};
	const syncRain = () => {
		const active =
			rainWanted &&
			heroInView &&
			!document.hidden &&
			!reducedMotionQuery.matches;
		rain.setActive(active);
	};
	const syncOpeningMotion = () => {
		const paused = !heroInView || document.hidden || mobileQuery.matches;
		openingTimeline?.paused(paused);
		textIntroTimeline?.paused(paused);
	};
	const heroVisibility = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) heroInView = entry.isIntersecting;
			syncRain();
			syncOpeningMotion();
			syncInteraction();
			if (!heroInView) stopIdleRotation();
			else if (tilesIntroDone && (heroScrollTrigger?.progress ?? 0) <= 0.002)
				startIdleRotation();
		},
		{ threshold: 0 },
	);
	heroVisibility.observe(hero);

	const updateSceneState = (progress: number) => {
		const timelineTime = progress * (timeline?.duration() ?? 1);
		const rainActive = progress <= 0.002 || timelineTime >= RAIN_ACTIVATE_TIME;
		const layerActive = interactionReady;
		quickActions.forEach((action) => {
			action.tabIndex = layerActive ? 0 : -1;
			action.setAttribute("aria-hidden", String(!layerActive));
		});
		rainWanted = rainActive;
		syncRain();
		if (progress > 0.002) {
			stopIdleRotation();
			completePendingIntros();
		} else if (!idleTimer && tilesIntroDone) {
			resetIdleTiles();
			startIdleRotation();
		}
		syncInteraction();
	};

	const getMosaicTransform = () => {
		if (!mosaic) return { x: 0, y: 0, scale: 1 };
		const rect = getHeroArtworkRect(hero, config.artwork);
		const mosaicWidth = mosaic.offsetWidth;
		const mosaicHeight = mosaic.offsetHeight;
		const mosaicCenterX = mosaic.offsetLeft;
		const mosaicCenterY = mosaic.offsetTop + mosaicHeight / 2;
		return {
			x: rect.x + rect.width / 2 - mosaicCenterX,
			y: rect.y + rect.height / 2 - mosaicCenterY,
			scale: rect.width / Math.max(1, mosaicWidth),
		};
	};

	const getTileEntranceTransform = (tile: TileState): TileEntranceTransform => {
		const horizontalRange = Math.max(
			hero.clientWidth * (mobileQuery.matches ? 0.22 : 0.29),
			mosaic?.offsetWidth ? mosaic.offsetWidth * 0.48 : 0,
		);
		const verticalRange = Math.max(
			hero.clientHeight * (mobileQuery.matches ? 0.16 : 0.24),
			mosaic?.offsetHeight ? mosaic.offsetHeight * 0.78 : 0,
		);
		const blurBase = mobileQuery.matches ? 8 : 13;
		const blurRange = mobileQuery.matches ? 6 : 10;
		const normalizedX = tile.offsetX / 75;
		const normalizedY = tile.offsetY / 57.5;
		const distance = Math.hypot(normalizedX, normalizedY);
		const minimumTravel = 0.52;
		const travelMultiplier =
			distance > 0 && distance < minimumTravel ? minimumTravel / distance : 1;

		return {
			x: normalizedX * travelMultiplier * horizontalRange,
			y: normalizedY * travelMultiplier * verticalRange,
			rotation: tile.rotation * 0.12,
			scaleX: 0.66 + Math.min(0.16, Math.max(0, (tile.scale - 0.72) * 0.48)),
			scaleY: 0.66 + Math.min(0.16, Math.max(0, (tile.scale - 0.72) * 0.48)),
			blur: Math.min(8, blurBase + (tile.blur / 5) * blurRange),
		};
	};

	const getTileIdleTransform = (tile: TileState): TileIdleTransform => {
		const mosaicWidth = mosaic?.offsetWidth ?? hero.clientWidth * 0.84;
		const mosaicHeight = mosaic?.offsetHeight ?? hero.clientHeight * 0.72;
		const idleVisible = Math.max(1, config.mosaic.idleVisible);
		const depth = tile.order % idleVisible;
		const depthProgress = idleVisible > 1 ? depth / (idleVisible - 1) : 0;
		const normalizedX = (tile.offsetX + 75) / 150;
		const normalizedY = (tile.offsetY + 57.5) / 115;
		const targetX = mosaicWidth * (0.04 + normalizedX * 0.92);
		const targetY = mosaicHeight * (0.3 + normalizedY * 0.62);
		const tileCenterX =
			((tile.column + 0.5) / config.mosaic.columns) * mosaicWidth;
		const tileCenterY = ((tile.row + 0.5) / config.mosaic.rows) * mosaicHeight;

		return {
			x: targetX - tileCenterX,
			y: targetY - tileCenterY,
			rotation: tile.rotation,
			scaleX: 1.18 - depthProgress * 0.38,
			scaleY: 1.18 - depthProgress * 0.38,
			blur: depthProgress * 7,
		};
	};

	// 首屏布局只服务于第一次静止展示；进入轮换后仍回到上面的随机布局。
	const getTileInitialTransform = (tile: TileState): TileTransform => {
		const layout = config.mosaic.initialLayout?.[tile.order];
		if (mobileQuery.matches || !mosaic || !layout) {
			return getTileIdleTransform(tile);
		}

		const mosaicWidth = Math.max(1, mosaic.offsetWidth);
		const mosaicHeight = Math.max(1, mosaic.offsetHeight);
		const columns = Math.max(1, config.mosaic.columns);
		const rows = Math.max(1, config.mosaic.rows);
		const clampRatio = (value: number, fallback: number) =>
			Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
		const centerX = clampRatio(layout.x, 0.5) * mosaicWidth;
		const centerY = clampRatio(layout.y, 0.5) * mosaicHeight;
		const tileCenterX = ((tile.column + 0.5) / columns) * mosaicWidth;
		const tileCenterY = ((tile.row + 0.5) / rows) * mosaicHeight;
		const width = Math.max(0.01, clampRatio(layout.width, 1 / columns));
		const height = Math.max(0.01, clampRatio(layout.height, 1 / rows));
		const rotation =
			typeof layout.rotation === "number" && Number.isFinite(layout.rotation)
				? layout.rotation
				: 0;
		const blur = Number.isFinite(layout.blur)
			? Math.max(0, layout.blur ?? 0)
			: 0;

		return {
			x: centerX - tileCenterX,
			y: centerY - tileCenterY,
			rotation,
			scaleX: width * columns,
			scaleY: height * rows,
			blur,
		};
	};

	const getBaseScrollDistance = () =>
		mobileQuery.matches
			? getHeroPinEndDistance(
					config.mosaic.mobileScrollDistance,
					window.innerHeight,
					config.mosaic.mobileMinViewports,
				)
			: getHeroPinEndDistance(
					config.mosaic.desktopScrollDistance,
					window.innerHeight,
					config.mosaic.desktopMinViewports,
				);

	const getDialogueEndProgress = () => {
		const duration = Math.max(0.001, timeline?.duration() ?? 1);
		return Math.min(1, DIALOGUE_REVEAL_END_TIME / duration);
	};

	const getDialogueTailDistance = () => {
		if (getDialogueEndProgress() >= 1) return 0;
		return Math.max(
			0,
			mobileQuery.matches
				? config.mosaic.mobileDialogueTailDistance
				: config.mosaic.desktopDialogueTailDistance,
		);
	};

	const getCompressedScrollDistance = () =>
		getBaseScrollDistance() * getDialogueEndProgress() +
		getDialogueTailDistance();

	const mapScrollProgressToTimelineProgress = (scrollProgress: number) => {
		const progress = Math.min(1, Math.max(0, scrollProgress));
		const baseDistance = getBaseScrollDistance();
		const dialogueEndProgress = getDialogueEndProgress();
		const preservedDistance = baseDistance * dialogueEndProgress;
		const tailDistance = getDialogueTailDistance();
		const scrollDistance = progress * (preservedDistance + tailDistance);

		if (scrollDistance <= preservedDistance) {
			return Math.min(
				dialogueEndProgress,
				scrollDistance / Math.max(1, baseDistance),
			);
		}
		if (tailDistance <= 0) return 1;

		return Math.min(
			1,
			dialogueEndProgress +
				((scrollDistance - preservedDistance) / tailDistance) *
					(1 - dialogueEndProgress),
		);
	};

	const renderTimelineForScroll = (scrollProgress: number) => {
		const progress = mapScrollProgressToTimelineProgress(scrollProgress);
		timeline?.totalProgress(progress);
		updateSceneState(progress);
	};

	const invalidateTimelineFromInitialState = () => {
		if (!timeline) return;
		const progress = timeline.totalProgress();
		// GSAP 的 to tween 会以 invalidate 时的当前值作为起点，先回到初始帧才能保留原始起点。
		timeline.totalProgress(0, true);
		timeline.invalidate();
		timeline.totalProgress(progress, true);
	};

	const buildTimeline = () => {
		if (!title || !mosaic || !backdrop || tiles.length === 0) return;

		gsap.set(mosaic, { xPercent: -50, x: 0, y: 0, scale: 1, autoAlpha: 0 });
		gsap.set(mosaicComplete, { autoAlpha: 0 });
		gsap.set(backdrop, { autoAlpha: 1 });
		gsap.set(dialogueRoot, { autoAlpha: 0, y: 0, scale: 1 });
		gsap.set(quickActions, { autoAlpha: 0, y: 38, scale: 0.42 });
		for (const tile of tiles) {
			const transform = tile.initiallyVisible
				? getTileInitialTransform(tile)
				: getTileEntranceTransform(tile);
			gsap.set(tile.element, {
				x: transform.x,
				y: transform.y,
				rotation: transform.rotation,
				scaleX: transform.scaleX,
				scaleY: transform.scaleY,
				filter: `blur(${transform.blur}px)`,
				autoAlpha: tile.initiallyVisible ? 1 : 0,
			});
		}

		timeline = gsap.timeline({
			defaults: { ease: "none" },
			paused: true,
		});

		timeline.to({}, { duration: 1 });
		// 首屏保留完整原画；碎片拼合落到同一个不放大矩形，避免交接跳位。
		timeline.fromTo(
			backdrop,
			{ autoAlpha: 1 },
			{ autoAlpha: 0, duration: 0.06, immediateRender: false },
			0.04,
		);
		timeline.fromTo(
			mosaic,
			{ autoAlpha: 0 },
			{ autoAlpha: 1, duration: 0.06, immediateRender: false },
			0.1,
		);
		// 这条 scrub 时间线会被 invalidate()（onRefreshInit / 窗口 resize 都会触发）。
		// GSAP 的 to 补间在 invalidate 后会把「当前 DOM 值」重新记录为起点：
		// 若 invalidate 发生在标题已淡出的深滚动状态，起点被记成 autoAlpha 0，
		// 之后滚回顶部标题永远不可见。因此所有补间一律 fromTo 显式锚定起点。
		timeline.fromTo(
			title,
			{ autoAlpha: 1, y: 0, yPercent: 0, scale: 1 },
			{
				y: -8,
				yPercent: 0,
				scale: 1,
				transformOrigin: "0% 50%",
				duration: 0.1,
				ease: "power3.inOut",
			},
			0,
		);
		// 左侧竖牌的退场使用字符随风散落，身份标题仅轻移与淡出。
		// 由 prepareFlyText() 在字体就绪后将 scatter 时间线挂载到 0.04 位置。
		timeline.fromTo(
			tiles.map((tile) => tile.element),
			{
				// 起点必须逐片区分：initiallyVisible 的碎片在进度 0 应可见，其余不可见
				autoAlpha: (index) => (tiles[index].initiallyVisible ? 1 : 0),
			},
			{
				autoAlpha: 0,
				duration: 0.06,
				ease: "power2.in",
			},
			0.04,
		);

		for (const tile of tiles) {
			const start = 0.1 + tile.order * 0.02;
			timeline.fromTo(
				tile.element,
				{
					x: () => getTileEntranceTransform(tile).x,
					y: () => getTileEntranceTransform(tile).y,
					rotation: () => getTileEntranceTransform(tile).rotation,
					scaleX: () => getTileEntranceTransform(tile).scaleX,
					scaleY: () => getTileEntranceTransform(tile).scaleY,
					filter: () => `blur(${getTileEntranceTransform(tile).blur}px)`,
					autoAlpha: 0,
				},
				{
					x: 0,
					y: 0,
					rotation: 0,
					scaleX: 1,
					scaleY: 1,
					filter: "blur(0px)",
					autoAlpha: 1,
					duration: 0.09,
					ease: "power3.inOut",
					immediateRender: false,
				},
				start,
			);
		}

		if (mosaicComplete) {
			timeline.fromTo(
				mosaicComplete,
				{ autoAlpha: 0 },
				{ autoAlpha: 1, duration: 0.03, ease: "none" },
				0.72,
			);
		}

		// 淡出段只动 autoAlpha：yPercent 已由上一段补间锚定，若这里再显式给
		// yPercent 起点，进度归零的回滚渲染会按时间序先后渲染两段，后渲染的
		// 这段把 yPercent 又写回自己的起点，标题会停在 -20% 偏移上。
		timeline.fromTo(
			title,
			{ autoAlpha: 1 },
			{
				autoAlpha: 0,
				duration: 0.08,
				ease: "power2.in",
			},
			0.72,
		);

		timeline.fromTo(
			mosaic,
			{ x: 0, y: 0, scale: 1 },
			{
				x: () => getMosaicTransform().x,
				y: () => getMosaicTransform().y,
				scale: () => getMosaicTransform().scale,
				duration: 0.2,
				ease: "power3.inOut",
			},
			0.76,
		);
		timeline.fromTo(
			backdrop,
			{ autoAlpha: 0 },
			{
				autoAlpha: 1,
				duration: 0.1,
				ease: "power2.inOut",
				immediateRender: false,
			},
			0.87,
		);
		timeline.fromTo(
			mosaic,
			{ autoAlpha: 1 },
			{
				autoAlpha: 0,
				duration: 0.07,
				ease: "power2.in",
				immediateRender: false,
			},
			0.92,
		);

		quickActions.forEach((action, index) => {
			timeline?.fromTo(
				action,
				{ autoAlpha: 0, y: 38, scale: 0.42 },
				{
					autoAlpha: 1,
					y: 0,
					scale: 1,
					duration: 0.14,
					ease: HERO_OPENING.ease,
				},
				QUICK_ACTIONS_REVEAL_TIME + index * 0.03,
			);
		});

		timeline.to(
			{},
			{ duration: Math.max(0, config.mosaic.interactionHold) },
			INTERACTION_HOLD_START,
		);

		const scrollState = { progress: 0 };
		scrollDriver = gsap.to(scrollState, {
			progress: 1,
			duration: 1,
			ease: "none",
			paused: true,
			onUpdate: () => renderTimelineForScroll(scrollState.progress),
		});

		heroScrollTrigger = ScrollTrigger.create({
			id: "home-hero-two-layer",
			trigger: hero,
			start: "top top",
			end: () => `+=${getCompressedScrollDistance()}`,
			pin: hero,
			pinSpacing: true,
			scrub: config.mosaic.scrub,
			anticipatePin: 1,
			animation: scrollDriver,
			invalidateOnRefresh: true,
			onRefreshInit: invalidateTimelineFromInitialState,
			onRefresh: (self) => {
				self.update();
				renderTimelineForScroll(scrollDriver?.progress() ?? self.progress);
			},
			onUpdate: (self) => {
				if (!scrollDriver) renderTimelineForScroll(self.progress);
			},
		});

		renderTimelineForScroll(heroScrollTrigger.progress);
		// 影像层要等 await import("gsap") 之后才建 pin，比这里晚若干微任务。
		// 立刻 refresh 会按「还没有影像层 .pin-spacer」的文档高度算 pin 起止点，
		// 攒到下一帧统一 refresh，那时各层的 pin 都已插好。
		requestScrollTriggerRefresh(ScrollTrigger);
	};

	// 首屏完整人物取代静止碎片轮换；碎片只在滚动过渡期间使用。
	const playTilesIntro = () => {
		tilesIntroDone = true;
	};

	// 拆字只服务既有左侧竖牌，身份标题和博客名牌保持真实的单行文本。
	const prepareFlyText = () => {
		const titleHost = hero.querySelector<HTMLElement>(
			".home-hero__title > span:first-child",
		);
		const contactHosts = (
			contact
				? [
						hero.querySelector<HTMLElement>(".home-hero__contact-platform"),
						hero.querySelector<HTMLElement>(".home-hero__contact-handle"),
					]
				: []
		).filter((host): host is HTMLElement => host !== null);
		const occupation = hero.querySelector<HTMLElement>(
			".home-hero__occupation > span",
		);
		const nameBadge = hero.querySelector<HTMLElement>(".home-hero__name-badge");
		const identityText = [occupation, titleHost, nameBadge].filter(
			(element): element is HTMLElement => element !== null,
		);
		const identityEntryState = {
			autoAlpha: 0,
			y: 8,
			yPercent: 0,
			scaleX: 1,
			scaleY: 1,
			skewY: 0,
			transformOrigin: "0% 100%",
		};

		// 字体就绪前先隐藏 contact，避免拆字前闪现原始整段文字。
		contactHosts.forEach((host) => {
			gsap.set(host, { autoAlpha: 0 });
		});
		gsap.set(identityText, identityEntryState);

		const mountContactScatter = () => {
			if (!timeline || !flyHandles.length) return;
			if (contactScatterTimeline) timeline.remove(contactScatterTimeline);
			const scatter = gsap.timeline();
			for (const handle of flyHandles) {
				const tl = handle.buildScatter(0.12);
				if (tl) scatter.add(tl, 0);
				const returnTimeline = handle.buildScatter(
					DIALOGUE_REVEAL_DURATION,
					"in",
				);
				if (returnTimeline)
					scatter.add(
						returnTimeline,
						DIALOGUE_REVEAL_TIME - DIALOGUE_REVEAL_DURATION - 0.04,
					);
			}
			contactScatterTimeline = scatter;
			timeline.add(scatter, 0.04);
			// paused 父时间线不会自动把新字符渲染到当前滚动位置。
			timeline.render(timeline.time(), true, true);
		};

		const handleFlyLayoutChange = () => {
			window.clearTimeout(flyLayoutTimer);
			flyLayoutTimer = window.setTimeout(() => {
				if (disposed) return;
				stopContactReaction();
				textIntroTimeline?.progress(1).kill();
				textIntroTimeline = null;
				// Range 返回视口坐标，先去掉祖先滚动缩放，测量后再由原时间线恢复。
				if (title) gsap.set(title, { y: 0, yPercent: 0, scale: 1 });
				for (const handle of flyHandles) handle.rebuild();
				mountContactScatter();
			}, 200);
		};

		document.fonts.ready.then(() => {
			if (disposed) return;
			if (reducedMotionQuery.matches || hero.dataset.reducedMotion === "true") {
				setReducedMotionState(hero);
				syncInteraction();
				return;
			}
			gsap.set(identityText, {
				autoAlpha: 1,
				y: 0,
				yPercent: 0,
				scaleX: 1,
				scaleY: 1,
				skewY: 0,
			});
			if (title) gsap.set(title, { y: 0, yPercent: 0, scale: 1 });
			flyHandles = contactHosts.map((host) => createFlyText(host));
			for (const handle of flyHandles) {
				handle.prepare();
				handle.onLayoutChange(handleFlyLayoutChange);
			}
			contactHosts.forEach((host) => {
				gsap.set(host, { autoAlpha: 1 });
			});

			mountContactScatter();

			const progress = heroScrollTrigger?.progress ?? 0;
			if (progress <= 0.01) {
				gsap.set(identityText, identityEntryState);
				const intro = gsap.timeline({
					defaults: { ease: HERO_OPENING.ease },
					onComplete: () => {
						textIntroTimeline = null;
						syncInteraction();
					},
				});
				intro.to(
					identityText,
					{
						autoAlpha: 1,
						y: 0,
						yPercent: 0,
						scaleX: 1,
						scaleY: 1,
						skewY: 0,
						duration: HERO_OPENING.titleDuration,
						ease: "power2.out",
						stagger: HERO_OPENING.occupationDelay - HERO_OPENING.titleDelay,
					},
					HERO_OPENING.titleDelay,
				);
				const contactEntrances = flyHandles
					.map((handle) =>
						handle.buildReveal(HERO_SIGNATURE_MOTION.revealDuration),
					)
					.filter((tl): tl is ReturnType<typeof gsap.timeline> => tl !== null);
				contactEntrances.forEach((tl, index) => {
					intro.add(tl, HERO_OPENING.tilesDelay + index * 0.08);
				});
				textIntroTimeline = intro;
			} else {
				for (const handle of flyHandles) handle.setNatural();
				gsap.set(identityText, {
					autoAlpha: 1,
					y: 0,
					yPercent: 0,
					scaleX: 1,
					scaleY: 1,
					skewY: 0,
				});
				timeline?.render(timeline.time(), true, true);
			}
			syncOpeningMotion();
			syncInteraction();
		});
	};

	if (reducedMotionQuery.matches) {
		interactionReady = true;
		sticker.setSceneVisible(true);
		setReducedMotionState(hero);
		syncInteraction();
	} else {
		if (opening) {
			openingTimeline = gsap.timeline();
			openingTimeline.fromTo(
				opening,
				{ scaleY: 1 },
				{
					scaleY: 0,
					duration: HERO_OPENING.duration,
					ease: "power4.inOut",
				},
			);
			openingTimeline.call(
				() => {
					interactionReady = true;
					syncInteraction();
				},
				[],
				HERO_OPENING.interactionDelay,
			);
		} else interactionReady = true;
		buildTimeline();
		playTilesIntro();
		prepareFlyText();
	}
	document.addEventListener(
		"visibilitychange",
		() => {
			syncRain();
			syncOpeningMotion();
			syncInteraction();
			if (document.hidden) stopIdleRotation();
			else if (tilesIntroDone && (heroScrollTrigger?.progress ?? 0) <= 0.002)
				startIdleRotation();
		},
		{ signal: abortController.signal },
	);
	mobileQuery.addEventListener(
		"change",
		() => {
			syncRain();
			syncOpeningMotion();
			syncInteraction();
		},
		{ signal: abortController.signal },
	);
	reducedMotionQuery.addEventListener(
		"change",
		() => {
			if (!reducedMotionQuery.matches) return;
			stopContactReaction();
			completePendingIntros();
			stopIdleRotation();
			heroScrollTrigger?.kill();
			heroScrollTrigger = null;
			scrollDriver?.kill();
			scrollDriver = null;
			timeline?.kill();
			timeline = null;
			rainWanted = false;
			syncRain();
			setReducedMotionState(hero);
			for (const handle of flyHandles) handle.setNatural();
			syncInteraction();
		},
		{ signal: abortController.signal },
	);
	document
		.querySelector(".home-page--motion-pending")
		?.classList.remove("home-page--motion-pending");

	if (resetAfterReload) {
		reloadFrame = requestAnimationFrame(() => {
			reloadFrame = 0;
			if (disposed) return;
			window.scrollTo(0, 0);
			timeline?.progress(0);
			scrollDriver?.progress(0);
			updateSceneState(0);
			requestScrollTriggerRefresh(ScrollTrigger);
			if (history.scrollRestoration === "manual") {
				history.scrollRestoration = previousScrollRestoration;
			}
		});
	}

	return () => {
		disposed = true;
		if (reloadFrame) {
			cancelAnimationFrame(reloadFrame);
			reloadFrame = 0;
			if (history.scrollRestoration === "manual") {
				history.scrollRestoration = previousScrollRestoration;
			}
		}
		cancelScrollTriggerRefresh();
		stopIdleRotation();
		window.clearTimeout(flyLayoutTimer);
		tilesIntroTimeline?.kill();
		tilesIntroTimeline = null;
		textIntroTimeline?.kill();
		textIntroTimeline = null;
		openingTimeline?.kill();
		openingTimeline = null;
		stopContactReaction();
		for (const handle of flyHandles) handle.destroy();
		flyHandles = [];
		contactScatterTimeline = null;
		heroVisibility.disconnect();
		rain.destroy();
		artwork.destroy();
		dialogue.destroy();
		sticker.destroy();
		abortController.abort();
		heroScrollTrigger?.kill();
		heroScrollTrigger = null;
		scrollDriver?.kill();
		scrollDriver = null;
		timeline?.kill();
		timeline = null;
		delete hero.dataset.heroMounted;
		delete hero.dataset.layerActive;
		delete hero.dataset.signaturePaused;
	};
}
