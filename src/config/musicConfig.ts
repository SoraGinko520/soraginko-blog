import type { MusicPlayerConfig } from "../types/config";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 禁用音乐播放器方法：
	// 在本配置文件把showInNavbar设为false即可关闭导航栏入口

	// 是否在导航栏显示音乐播放器入口
	showInNavbar: false,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.6,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否显启用歌词
	showLyrics: true,

	// 禁用时不请求任何音乐服务。
	meting: {
		api: "",
		server: "netease",
		type: "playlist",
		id: "",
		auth: "",
		fallbackApis: [],
	},
	local: { playlist: [] },

	// 可视化器配置
	visualizer: {
		background: {
			dark: "#000000",
			light: "#000000",
		},
		camera: {
			position: {
				x: 0,
				y: 32,
				z: 52,
			},
		},
		autoRotate: true,
		autoRotateSpeed: 0.3,
		height: {
			// 静态地形起伏高度，不播放时也会有轻微波动
			idle: 0.6,
			// 超低频高度，主要影响中央区域的大起伏
			subBass: 4.0,
			// 低频高度，主要跟随鼓点和低音起伏
			bass: 3.0,
			// 中低频高度，补充地形整体层次
			lowMid: 2.0,
			// 中频高度，影响流动感较强的区域
			mid: 2.5,
			// 中高频高度，影响外围零散跳动
			highMid: 2.0,
			// 高能量瞬间的随机尖峰高度
			energy: 4.0,
			// 普通点击/音频涟漪高度
			ripple: 3.0,
			// 白色强调涟漪高度
			rippleAccent: 1.0,
		},
		// 想要红色：用 #ff4444
		// 想要透明度：别塞进 rippleColor，单独加一个 rippleOpacity 或 rippleAlpha
		theme: {
			base1: "#000000",
			base2: "#000000",
			coolCore: "#16b8c9",
			coolEdge: "#69dce7",
			warmCore: "#8be8ee",
			warmEdge: "#d9ffff",
			rippleColor: "#3bcbd9",
			// 波纹冷暖锚点：安静/低频偏冷、明亮/高频偏暖，与地形冷暖同步联动
			rippleCool: "#3bcbd9",
			rippleWarm: "#d9ffff",
			fogColor: "#050810",
			glowIntensity: 0.86,
		},
	},
};
