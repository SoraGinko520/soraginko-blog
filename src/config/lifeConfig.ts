import I18nKey from "@/i18n/i18nKey";
import type { LifeConfig } from "@/types/config";

/**
 * 生活内容的唯一配置入口，不搬入参考作者的书单、动态或 Bilibili 身份。
 * 相册继续在 galleryConfig.ts 维护；长文继续放 posts，短记录放 moments。
 */
export const lifeConfig: LifeConfig = {
	navigation: [
		{
			id: "albums",
			label: I18nKey.gallery,
			ariaLabel: I18nKey.lifeViewAlbums,
			eyebrow: "Album",
			url: "/gallery/",
			icon: "material-symbols:photo-library",
			position: "top-left",
		},
		{
			id: "bilibili",
			label: I18nKey.lifeBilibili,
			ariaLabel: I18nKey.lifeViewBilibili,
			eyebrow: "Bilibili",
			url: "/life/bilibili/",
			icon: "simple-icons:bilibili",
			position: "top-right",
		},
		{
			id: "moments",
			label: I18nKey.lifeMoments,
			ariaLabel: I18nKey.lifeViewMoments,
			eyebrow: "Moments",
			url: "/life/moments/",
			icon: "material-symbols:chat-bubble-outline",
			position: "bottom-left",
		},
		{
			id: "books",
			label: I18nKey.lifeBooks,
			ariaLabel: I18nKey.lifeViewBooks,
			eyebrow: "Bookshelf",
			url: "/life/books/",
			icon: "material-symbols:menu-book-outline",
			position: "bottom-right",
		},
	],
	books: [
		{
			id: "ryuo-no-oshigoto",
			title: "龙王的工作",
			author: "白鸟士郎",
			cover: "assets/images/books/ryuo-no-oshigoto.png",
			category: "轻小说",
			tags: ["竞技", "青春", "恋爱", "后宫", "青梅竹马"],
			status: "finished",
			note: "玄关门一打开，眼前冒出了一位 JS（小学女生）。\n「我依照约定来了，请收我为徒弟！」\n年仅十六岁，便拥有将棋界最高头衔「龙王」的九头龙八一家里，出现了一位名叫雏鹤爱的小学三年级生，九岁。\n「什么？……徒弟？你在说什么？」\n「……您不记得了吗？」\n八一对自己答应过的事情完全没有印象，却展开了与小学生同居的生活。受到爱直率的热情影响，八一也逐渐取回险些丧失的热忱——",
		},
		{
			id: "danmachi",
			title: "在地下城寻求邂逅是否搞错了什么",
			author: "大森藤野",
			cover: "assets/images/books/danmachi.png",
			category: "轻小说",
			tags: ["奇幻", "战斗", "冒险", "后宫", "人外"],
			status: "finished",
			note: "迷宫都市欧拉丽——这是一座拥有雄伟地下迷宫（通称「地下城」）的巨大都市。名为未知的兴奋、光辉显赫的荣耀，以及与可爱女孩的罗曼史。在这人们的梦想与欲望伺机而动的城市里，少年遇见了一位小小的「神仙」。吃遍所有【眷族】的闭门羹、矢志成为冒险者的少年，与成员零名的神仙，发生了一场命运的邂逅。这是少年的轨迹、女神的纪录。",
		},
		{
			id: "re-zero",
			title: "Re：从零开始的异世界生活",
			author: "长月达平",
			cover: "assets/images/books/re-zero.png",
			category: "轻小说",
			tags: ["转生", "战斗", "冒险", "后宫", "人外"],
			status: "finished",
			note: "走出便利商店要回家的高中生‧菜月昴突然被召唤到异世界。\n这莫非就是很流行的异世界召唤!?可是眼前没有召唤者就算了，还遭遇强盗迅速面临性命危机。\n这时，一名神秘银发美少女和猫精灵拯救了一筹莫展的他。\n以报恩为名义，昴自告奋勇要帮助少女找东西。\n然而，好不容易才掌握到线索，昴和少女却被不明人士攻击而殒命──本来应该是这样，但回过神来，昴却发现自己置身在第一次被召唤到这个异世界时的所在位置。\n「死亡回归」──无力的少年得到的唯一能力，是死后时间会倒转回到一开始。跨越无数绝望，从死亡的命运中拯救少女！",
		},
	],
	bilibili: {
		enabled: true,
		uid: "546979349",
	},
	moments: [],
};
