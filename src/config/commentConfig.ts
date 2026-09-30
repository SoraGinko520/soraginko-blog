import type { CommentConfig } from "@/types/config";

export const commentConfig: CommentConfig = {
	type: "waline",
	waline: {
		serverURL: "https://comment.soraginko.moe/",
		lang: "zh-CN",
		emoji: [
			"https://unpkg.com/@waline/emojis@1.4.0/weibo",
			"https://unpkg.com/@waline/emojis@1.4.0/bilibili",
			"https://unpkg.com/@waline/emojis@1.4.0/bmoji",
		],
		// 允许匿名评论；服务端 COMMENT_AUDIT=true 开启先审后发。
		login: "enable",
		visitorCount: false,
	},
};
