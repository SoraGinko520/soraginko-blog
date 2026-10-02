import { gsap } from "gsap";
import type {
	HeroDialogueLine,
	HeroReactionAction,
	HeroStickerExpression,
} from "@/types/config";

const STICKER_EXPRESSIONS: HeroStickerExpression[] = [
	"idle",
	"blink",
	"smile",
	"greet",
];
const STICKER_REACTION = {
	entryDuration: 0.38,
	returnDuration: 0.82,
	blinkHold: 0.18,
	ease: "power2.inOut",
	poses: {
		greet: { xPercent: 1.5, yPercent: -1, rotation: -3, scale: 1.015 },
		nod: { xPercent: 0, yPercent: 1.2, rotation: 1, scale: 0.985 },
		tilt: { xPercent: -1.2, yPercent: 0, rotation: 3.5, scale: 1 },
	} satisfies Record<HeroReactionAction, gsap.TweenVars>,
};

export function initHomeHeroSticker(hero: HTMLElement): {
	playReaction: (line: HeroDialogueLine) => void;
	setSceneVisible: (visible: boolean) => void;
	reset: () => void;
	destroy: () => void;
} {
	const sticker = hero.querySelector<HTMLElement>("[data-hero-sticker]");
	const image = sticker?.querySelector<HTMLImageElement>(
		"[data-hero-sticker-image]",
	);
	if (!sticker || !image) {
		return {
			playReaction: () => undefined,
			setSceneVisible: () => undefined,
			reset: () => undefined,
			destroy: () => undefined,
		};
	}

	const frameCount = Number.parseInt(
		sticker.dataset.frameCount ?? String(STICKER_EXPRESSIONS.length),
		10,
	);
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const abortController = new AbortController();
	let reaction: gsap.core.Timeline | null = null;
	let isSceneVisible = false;

	const setExpression = (expression: HeroStickerExpression): void => {
		const frameIndex = STICKER_EXPRESSIONS.indexOf(expression);
		sticker.dataset.expression = expression;
		gsap.set(image, { xPercent: -(frameIndex * 100) / frameCount });
	};

	const stopMovement = (): void => {
		reaction?.kill();
		reaction = null;
		gsap.set(sticker, { clearProps: "transform,willChange" });
	};

	const reset = (): void => {
		stopMovement();
		setExpression("idle");
	};

	const playReaction = (line: HeroDialogueLine): void => {
		reset();
		if (!isSceneVisible || document.visibilityState !== "visible") return;
		const expression = line.expression ?? "idle";
		setExpression(expression);
		if (reducedMotion.matches) return;
		const shouldGreetThenSmile =
			line.action === "greet" && expression === "smile";
		if (shouldGreetThenSmile) setExpression("greet");

		// 每次点击只保留一段位移回应；图集切帧不测量布局，也不伪造口型。
		sticker.style.willChange = "transform";
		reaction = gsap.timeline({
			defaults: { ease: STICKER_REACTION.ease },
			onComplete: () => {
				reaction = null;
				gsap.set(sticker, { clearProps: "transform,willChange" });
				setExpression("idle");
			},
		});
		reaction
			.to(sticker, {
				...STICKER_REACTION.poses[line.action ?? "tilt"],
				duration: STICKER_REACTION.entryDuration,
			})
			.to(sticker, {
				xPercent: 0,
				yPercent: 0,
				rotation: 0,
				scale: 1,
				duration: STICKER_REACTION.returnDuration,
			});
		if (expression === "blink") {
			reaction.call(
				() => setExpression("idle"),
				[],
				STICKER_REACTION.blinkHold,
			);
		}
		if (shouldGreetThenSmile) {
			reaction.call(
				() => setExpression("smile"),
				[],
				STICKER_REACTION.entryDuration,
			);
		}
	};

	document.addEventListener(
		"visibilitychange",
		() => {
			if (document.visibilityState !== "visible") reset();
		},
		{ signal: abortController.signal },
	);
	reducedMotion.addEventListener("change", stopMovement, {
		signal: abortController.signal,
	});

	return {
		playReaction,
		setSceneVisible: (visible) => {
			if (isSceneVisible === visible) return;
			isSceneVisible = visible;
			if (!visible) reset();
		},
		reset,
		destroy: () => {
			abortController.abort();
			reset();
			gsap.set(image, { clearProps: "transform" });
		},
	};
}
