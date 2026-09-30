import type { HomeConfig } from "../types/config";

export const homeConfig: HomeConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.webp"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.webp"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	avatar: "assets/images/avatar.webp",

	// 名字
	name: "SoraGinko",

	// 首页展示名字（留空则使用 name）
	displayName: "SoraGinko",

	// 职业/身份标签
	occupation: "",

	// 个人签名（支持多条，会循环打字+删除效果）
	bio: ["记录技术、学习与生活。"],

	hero: {
		backgroundImage: "/assets/images/home/home.avif",
		mosaic: {
			rows: 4,
			columns: 6,
			idleVisible: 6,
			idleInterval: 900,
			seed: 20260814,
			// 首屏六块碎片按 reveal rank 放置；滚动或轮换后的随机布局不受影响。
			initialLayout: [
				{ x: 0.14, y: 0.305, width: 0.104, height: 0.205 },
				{ x: 0.435, y: 0.18, width: 0.068, height: 0.13, blur: 5.5 },
				{ x: 0.642, y: 0.368, width: 0.047, height: 0.092, blur: 5 },
				{ x: 0.863, y: 0.402, width: 0.097, height: 0.19 },
				{ x: 0.337, y: 0.653, width: 0.159, height: 0.313 },
				{ x: 0.639, y: 0.751, width: 0.116, height: 0.228 },
			],
			scrub: 0.45,
			// 滑动距离整体砍半，同样的滚动量推进更快
			desktopScrollDistance: 3250,
			mobileScrollDistance: 2300,
			desktopDialogueTailDistance: 240,
			mobileDialogueTailDistance: 180,
			desktopMinViewports: 4.05,
			mobileMinViewports: 3.05,
			interactionHold: 0.06,
		},
		contact: {
			platform: "博客",
			handle: "SoraGinko",
		},
		sticker: {
			image: "/assets/images/home/character.avif",
			alt: "黑猫角色贴纸",
			eye: {
				xPercent: 41.1,
				yPercent: 48.2,
				travelXPercent: 1.4,
				travelYPercent: 1,
			},
			rightEye: {
				xPercent: 64.1,
				yPercent: 44.7,
			},
			mouth: {
				xPercent: 53.4,
				yPercent: 50.7,
				widthPercent: 7.2,
				heightPercent: 1.9,
				rotation: -6,
				travelScale: 0.45,
			},
		},
		// 对话内容暂时留空，不继承原作者个人介绍。
		dialogue: {
			enabled: false,
			speakers: { host: "SoraGinko", visitor: "访客" },
			menuTitle: "",
			typingSpeed: 45,
			autoDelay: 1600,
			intro: [],
			topics: [],
		},
		// 玻璃雨珠 + 撞击水花（移动端自动降低密度，尊重 prefers-reduced-motion）
		rain: {
			enabled: true,
			intensity: 0.6,
			// 留空则随主题自动取色（暗色→白 / 浅色→深灰）；也可填 "#7fb0ff" 或 "127,176,255"
			color: "#ffffff",
		},
	},

	dataLayer: {
		visitImage: "/assets/images/home/home-data-1.avif",
		archiveImage: "/assets/images/home/home-data-2.avif",
		contactImage: "/assets/images/home/home-data-3.avif",
	},

	// 桌面端双层影像交互：固定背景揭示 → 五幕画面横向叙事
	homeBlinds: {
		enabled: true,
		reveal: {
			backgroundImage: "/assets/images/home-blinds/act2/1.webp",
			foregroundImage: "/assets/images/home-blinds/act1/1.webp",
			foregroundAlt: "奔跑人物剪影",
			foregroundOpacity: 0.5,
			pointerTravel: 28,
			// 长条横移揭示的入场标题：标题单行显示（版式按 4 字排），
			// 祝福语单行显示（版式按 5 字排），可自由增减条数
			headline: {
				title: "祝愿各位",
				messages: ["夜路有星光", "岁岁皆欢愉", "所念皆星河", "版本无回滚"],
				enterDuration: 0.6,
				messageHold: 2.6,
				messageFlipDuration: 0.75,
			},
		},
		scenes: {
			scrollDistance: 3400,
			// 背景跑马灯：列表从右往左无缝循环，只有一张也会自动复制到铺满
			cycleImages: ["/assets/images/home-blinds/act-cycle/1.webp"],
			cycleDuration: 26,
			composite: {
				eyebrow: "PROLOGUE / RUN",
				title: "记录日常",
				description: "记录技术、学习与生活。",
				alt: "第一幕插画",
				// 明信片右下角的落款日期，按每张图的实际日期改；删掉即不显示
			},
			items: [
				{
					eyebrow: "SCENE 02 / LIGHT",
					title: "技术笔记",
					description: "整理代码与实践中的思考。",
					image: "/assets/images/home-blinds/act3/1.webp",
					alt: "第二幕插画",
				},
				{
					eyebrow: "SCENE 03 / WIND",
					title: "学习记录",
					description: "记录学习过程中的问题与收获。",
					image: "/assets/images/home-blinds/act3/2.webp",
					alt: "第三幕插画",
				},
				{
					eyebrow: "SCENE 04 / PAGE",
					title: "生活片段",
					description: "留下一些日常的观察与想法。",
					image: "/assets/images/home-blinds/act3/3.webp",
					alt: "第四幕插画",
				},
				{
					eyebrow: "FINALE / ARRIVE",
					title: "慢慢更新",
					description: "内容正在整理中。",
					image: "/assets/images/home-blinds/act3/4.webp",
					alt: "第五幕插画",
				},
			],
			standImages: ["/assets/images/home-blinds/act4/1.webp"],
		},
	},

	// 链接配置
	// 已经预装的图标集：fa7-brands，fa7-regular，fa7-solid，material-symbols，simple-icons
	// 访问https://icones.js.org/ 获取图标代码，
	// 如果想使用尚未包含相应的图标集，则需要安装它
	// `pnpm add @iconify-json/<icon-set-name>`
	// showName: true 时显示图标和名称，false 时只显示图标
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/SoraGinko520",
			showName: false,
		},
		{
			name: "站内留言",
			icon: "material-symbols:chat-rounded",
			url: "/guestbook/",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
	],
};
