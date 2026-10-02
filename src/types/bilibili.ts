export interface BilibiliAnime {
	id: number;
	title: string;
	cover: string;
	url: string;
	overview: string;
	progress: string;
	rating: number | null;
	/** 公开追番接口的来源类型：番剧或追剧。 */
	kind: "anime" | "drama";
}

export interface BilibiliFollowSnapshot {
	items: BilibiliAnime[];
	state: "success" | "unavailable" | "unconfigured" | "disabled";
}
