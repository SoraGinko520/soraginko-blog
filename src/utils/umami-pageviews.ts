/** Cloud 免费模式仅链接公开统计页，不请求 Share / Metrics API。 */
export function getUmamiShareUrl(shareId: string | undefined): string {
	const id = shareId?.trim();
	return id ? `https://cloud.umami.is/share/${encodeURIComponent(id)}` : "";
}
