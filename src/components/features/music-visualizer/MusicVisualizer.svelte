<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { musicPlayerConfig } from "@/config";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import { AudioAnalyzer } from "./AudioAnalyzer";
import LyricsOverlay from "./LyricsOverlay.svelte";
import ThreeScene from "./ThreeScene.svelte";
import VisualizerControls from "./VisualizerControls.svelte";

const audioAnalyzer = new AudioAnalyzer();
let sceneFailed = $state(false);
let backgroundColor = $state(
	musicPlayerConfig.visualizer?.background?.dark ?? "#0a0a15",
);

onMount(() => {
	let waitTimer: ReturnType<typeof setTimeout> | undefined;
	let isMounted = true;
	const connectAudio = () => {
		if (!isMounted) return;
		const mgr = window.__fireflyMusic;
		const audio = document.getElementById("firefly-music-audio");
		if (!mgr || !(audio instanceof HTMLAudioElement)) {
			waitTimer = setTimeout(connectAudio, 200);
			return;
		}
		audioAnalyzer.connect(audio);
	};
	connectAudio();

	const handleAudioResume = () => {
		audioAnalyzer.resume();
	};
	document.addEventListener("click", handleAudioResume);

	return () => {
		isMounted = false;
		clearTimeout(waitTimer);
		document.removeEventListener("click", handleAudioResume);
	};
});

onDestroy(() => {
	audioAnalyzer.disconnect();
});
</script>

<div class="music-visualizer" style={`background: ${backgroundColor};`}>
	<div class="music-visualizer__desktop-layout">
		<VisualizerControls />
		<LyricsOverlay />
	</div>
	{#if sceneFailed}
		<p class="music-visualizer__scene-status" role="status">
			{i18n(I18nKey.musicVisualizerUnavailable)}
		</p>
	{/if}
	<ThreeScene
		{audioAnalyzer}
		{backgroundColor}
		onSceneReady={() => (sceneFailed = false)}
		onSceneError={() => (sceneFailed = true)}
	/>
</div>
