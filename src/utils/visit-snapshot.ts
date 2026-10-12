import { siteConfig } from "@/config";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import type { VisitStatisticsSnapshot } from "@/types/config";

/** 快照只属于原站点，变更正式域名后不能自动沿用旧站数字。 */
export function getVisitSnapshot(): VisitStatisticsSnapshot | undefined {
	const snapshot = siteConfig.analytics?.visitSnapshot;
	return snapshot?.hostname === new URL(siteConfig.site_url).hostname
		? snapshot
		: undefined;
}

export function formatVisitSnapshot(snapshot: VisitStatisticsSnapshot): string {
	const summary = i18n(I18nKey.visitsSummary)
		.replace("{uv}", snapshot.siteUv.toLocaleString())
		.replace("{pv}", snapshot.sitePv.toLocaleString());
	return `${i18n(I18nKey.visitsSnapshotLabel)} · ${summary} · ${i18n(I18nKey.visitsSnapshotSource)}`;
}
