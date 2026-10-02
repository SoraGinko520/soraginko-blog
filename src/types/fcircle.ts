/** 构建期聚合后的安全纯文本动态；不保存远程正文。 */
export interface FcircleItem {
	friendName: string;
	friendAvatar: string;
	friendUrl: string;
	title: string;
	url: string;
	publishedAt: string;
	summary: string;
	tags: string[];
}

export interface FcircleDateGroup {
	dateKey: string;
	label: string;
	fullDate: string;
	items: FcircleItem[];
}

export interface FcircleStats {
	todayCount: number;
	weekCount: number;
	articleCount: number;
	siteCount: number;
}

export interface FcircleDateOptions {
	locale: string;
	timeZone: string;
	today: string;
	yesterday: string;
	dayBeforeYesterday: string;
}

export type FcircleView = "timeline" | "grid";
