import type { FooterConfig } from "../types/config";

export const footerConfig: FooterConfig = {
	// 社交链接（mailto:/tel: 开头的链接不会在新标签打开）
	socialLinks: [
		{
			label: "GitHub",
			href: "https://github.com/SoraGinko520",
			icon: "fa7-brands:github",
		},
	],

	// 备案信息（icp/police 留空则不显示对应条目）
	beian: {
		icp: "",
		police: "",
		policeIcon: "/assets/images/备案图标.png",
		icpUrl: "https://beian.miit.gov.cn/#/Integrated/index",
		policeUrl: "https://beian.mps.gov.cn/",
	},

	// Powered by 信息
	moeIcp: {
		enabled: true,
		text: "萌ICP备20261035号",
		url: "https://icp.gov.moe/?keyword=20261035",
	},
	poweredBy: [
		{ label: "框架", name: "Astro", href: "https://astro.build" },
		{
			label: "主题",
			name: "Firefly-Mod",
			href: "https://github.com/MmzMing/my-blog",
		},
	],
};
