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
	books: [],
	bilibili: {
		enabled: true,
		uid: "546979349",
	},
	moments: [],
};
