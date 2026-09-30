import type { FriendLink, FriendsPageConfig } from "@/types/config";

export const friendsPageConfig: FriendsPageConfig = {
	title: "",
	description: "",
	showComment: false,
	randomizeSort: false,
	applyLink: "",
	siteInfo: {
		name: "SoraGinko",
		desc: "记录技术、学习与生活的个人博客。",
		url: "https://soraginko.moe",
		avatar: "",
		email: "",
	},
	notes: [],
	chat: [],
};

export const friendsConfig: FriendLink[] = [];

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
