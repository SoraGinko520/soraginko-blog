import type { FriendLink, FriendsPageConfig } from "@/types/config";

export const friendsPageConfig: FriendsPageConfig = {
	title: "",
	description: "",
	showComment: false,
	randomizeSort: false,
	applyLink:
		"https://github.com/SoraGinko520/soraginko-blog/issues/new?template=friend-link.yml",
	siteInfo: {
		name: "SoraGinko",
		desc: "记录技术、学习与生活的个人博客。",
		url: "https://soraginko.moe",
		avatar:
			"https://soraginko.moe/assets/images/home/silver-author-avatar.5242def51b6f.webp",
		email: "",
	},
	notes: [
		{
			title: "先添加本站链接",
			content: "请在自己的友链页添加下方本站信息，再通过 GitHub 表单申请。",
		},
		{
			title: "提交真实信息",
			content:
				"网站、头像和友链页须可公开访问；不接收广告、违法或冒用他人身份的网站。",
		},
		{
			title: "审核后收录",
			content: "自动检查可达性和回链，站长确认后收录；处理状态见申请 Issue。",
		},
	],
	chat: [],
};

export const friendsConfig: FriendLink[] = [
	{
		title: "Kihana's Blog",
		imgurl: "https://blog.kihana.asia/assets/favicon.ico",
		desc: "Kihana的个人博客",
		siteurl: "https://blog.kihana.asia/",
		feedUrl: "https://blog.kihana.asia/feed.xml",
		tags: ["博客"],
		weight: 100,
		enabled: true,
	},
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	// 权重降序；同权重时保留配置列表中的原始顺序
	return friends
		.map((friend, index) => ({ friend, index }))
		.sort((a, b) => b.friend.weight - a.friend.weight || a.index - b.index)
		.map(({ friend }) => friend);
};
