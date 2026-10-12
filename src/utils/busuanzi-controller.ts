import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import {
	definePageIsland,
	definePersistentIsland,
} from "@/utils/swup-lifecycle";
import { getVisitSnapshot } from "@/utils/visit-snapshot";

// iBruce 原版使用 JSONP，不同时加载公共脚本，避免与 Swup 导航重复计数。
const BUSUANZI_ENDPOINT = "https://busuanzi.ibruce.info/busuanzi";
const REQUEST_TIMEOUT_MS = 10_000;
const SOURCE_NAME = "不蒜子（iBruce）";

/** 只从固定 HTTPS 服务加载回调；结果仍按 unknown 校验，不渲染远程 HTML。 */
function requestCounts(signal: AbortSignal): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const callbackName = `SoraGinkoBusuanzi_${crypto.randomUUID().replaceAll("-", "")}`;
		const script = document.createElement("script");
		let settled = false;
		const cleanup = (): void => {
			script.onerror = null;
			script.onload = null;
			script.remove();
			signal.removeEventListener("abort", onAbort);
			Reflect.deleteProperty(window, callbackName);
		};
		const fail = (message: string): void => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(new Error(message));
		};
		const onAbort = (): void => fail("Busuanzi request cancelled");
		if (signal.aborted) {
			fail("Busuanzi request cancelled");
			return;
		}
		Reflect.set(window, callbackName, (data: unknown) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(data);
		});
		script.async = true;
		// 该服务按 Referer 区分文章；调用前跳过带查询参数的网址，避免外发参数。
		script.referrerPolicy = "no-referrer-when-downgrade";
		script.src = `${BUSUANZI_ENDPOINT}?jsonpCallback=${callbackName}`;
		script.onerror = () => fail("Busuanzi script request failed");
		script.onload = () => fail("Missing Busuanzi callback");
		signal.addEventListener("abort", onAbort, { once: true });
		document.head.appendChild(script);
	});
}

function readCount(value: unknown, baseline = 0): string | null {
	if (typeof value !== "number" && typeof value !== "string") return null;
	if (typeof value === "string" && !/^\d+$/.test(value)) return null;
	const count = Number(value);
	const total = count + baseline;
	return Number.isSafeInteger(count) &&
		count >= 0 &&
		Number.isSafeInteger(baseline) &&
		baseline >= 0 &&
		Number.isSafeInteger(total)
		? total.toLocaleString()
		: null;
}

/** 全站计数共用一个页面孤岛，桌面、移动端和文章不能各自发计数请求。 */
export function initBusuanzi(): void {
	definePersistentIsland("busuanzi", () => {
		let request: AbortController | null = null;
		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		definePageIsland({
			name: "busuanzi-counts",
			mount() {
				const visitCard = document.querySelector<HTMLElement>(
					'[data-stat-kind="visits"]',
				);
				const detail =
					visitCard?.querySelector<HTMLElement>(".data-card__detail");
				const mobileButtons = document.querySelectorAll<HTMLElement>(
					'.home-mobile [data-stat-key="uv"], .home-mobile [data-stat-key="pv"]',
				);
				const articleCounts = document.querySelectorAll<HTMLElement>(
					"[data-busuanzi-page-value]",
				);
				const source = `${i18n(I18nKey.siteStatsSource)}: ${SOURCE_NAME}`;
				const snapshot = getVisitSnapshot();
				const combinedCounts = snapshot
					? i18n(I18nKey.visitsCombinedCounts)
					: "";
				const baselineUv = snapshot?.siteUv.toLocaleString() ?? "--";
				const baselinePv = snapshot?.sitePv.toLocaleString() ?? "--";
				const syncPopup = (): void => {
					const popup = document.querySelector<HTMLElement>(
						".home-mobile [data-stats-popup]",
					);
					const activeButton = Array.from(mobileButtons).find(
						(button) => button.dataset.statKey === popup?.dataset.statKey,
					);
					if (!popup || !activeButton) return;
					const valueNode =
						popup.querySelector<HTMLElement>("[data-popup-value]");
					const detailNode = popup.querySelector<HTMLElement>(
						"[data-popup-detail]",
					);
					if (valueNode)
						valueNode.textContent = activeButton.dataset.popupValue ?? "--";
					if (detailNode)
						detailNode.textContent = activeButton.dataset.popupDetail ?? "";
				};
				const setStatus = (message: string, isLoading = false): void => {
					// 未取得新计数时只展示历史基数，并保留加载/不可用说明，不假定新增为零。
					const baselineSummary = snapshot
						? `${i18n(I18nKey.visitsSnapshotLabel)} · ${i18n(I18nKey.visitsSummary).replace("{uv}", baselineUv).replace("{pv}", baselinePv)} · `
						: "";
					const statusDetail = `${baselineSummary}${message} · ${source}`;
					if (detail) {
						detail.textContent = statusDetail;
						detail.title = statusDetail;
						detail.setAttribute("aria-busy", String(isLoading));
					}
					mobileButtons.forEach((button) => {
						const value =
							button.dataset.statKey === "uv" ? baselineUv : baselinePv;
						button.dataset.popupValue = value;
						button.dataset.popupDetail = statusDetail;
						button.title = statusDetail;
						button.setAttribute("aria-busy", String(isLoading));
						const node =
							button.querySelector<HTMLElement>("[data-mobile-stat]");
						if (node) node.textContent = value;
					});
					visitCard
						?.querySelectorAll<HTMLElement>("[data-stat-source]")
						.forEach((node) => {
							node.textContent = SOURCE_NAME;
						});
					visitCard
						?.querySelectorAll<HTMLElement>(
							'[data-stat-value="UV"], [data-stat-value="PV"]',
						)
						.forEach((node) => {
							node.textContent =
								node.dataset.statValue === "UV" ? baselineUv : baselinePv;
						});
					articleCounts.forEach((node) => {
						node.textContent = node.dataset.busuanziPageBase
							? readCount(node.dataset.busuanziPageBase)
							: isLoading
								? i18n(I18nKey.pageViewsLoading)
								: "--";
						const articleStatus = `${node.dataset.busuanziPageBase ? `${i18n(I18nKey.visitsSnapshotLabel)} ${node.textContent} · ` : ""}${message} · ${source}`;
						node.title = articleStatus;
						node.setAttribute("aria-label", articleStatus);
						node.setAttribute("aria-busy", String(isLoading));
					});
					syncPopup();
				};

				// 公共计数按 URL 归属；预览和 localhost 不发送请求，也不伪装成正式域名。
				if (
					location.protocol !== "https:" ||
					location.hostname !== document.body.dataset.busuanziHost
				) {
					setStatus(i18n(I18nKey.visitsPreview));
					return;
				}
				if (location.search) {
					setStatus(i18n(I18nKey.visitsQuerySkipped));
					return;
				}

				const currentRequest = new AbortController();
				request = currentRequest;
				timeoutId = setTimeout(
					() => currentRequest.abort(),
					REQUEST_TIMEOUT_MS,
				);
				setStatus(i18n(I18nKey.visitsLoading), true);
				// 每代只加载一个计数回调，失败不重试；退出页面时取消并清理回调。
				void requestCounts(currentRequest.signal)
					.then((data: unknown) => {
						if (!data || typeof data !== "object")
							throw new Error("Invalid counts");
						// 每次从接口原始数值加固定基数，不能从已显示的累计数继续相加。
						const uv = readCount(
							"site_uv" in data ? data.site_uv : null,
							snapshot?.siteUv ?? 0,
						);
						const pv = readCount(
							"site_pv" in data ? data.site_pv : null,
							snapshot?.sitePv ?? 0,
						);
						const rawPagePv = "page_pv" in data ? data.page_pv : null;
						const pagePv = readCount(rawPagePv);
						if (
							uv === null ||
							pv === null ||
							(articleCounts.length > 0 && pagePv === null)
						) {
							throw new Error("Missing counts");
						}
						// 导航后旧请求不得写入新页面；不渲染远程 HTML，只接受非负整数。
						if (request !== currentRequest || currentRequest.signal.aborted)
							return;
						if (detail) {
							detail.textContent = `${i18n(I18nKey.visitsSummary).replace("{uv}", uv).replace("{pv}", pv)} · ${source}`;
							detail.title = combinedCounts;
							detail.setAttribute("aria-busy", "false");
						}
						visitCard
							?.querySelectorAll<HTMLElement>("[data-stat-value]")
							.forEach((node) => {
								if (node.dataset.statValue === "UV") node.textContent = uv;
								if (node.dataset.statValue === "PV") node.textContent = pv;
							});
						mobileButtons.forEach((button) => {
							const value = button.dataset.statKey === "uv" ? uv : pv;
							button.dataset.popupValue = value;
							button.dataset.popupDetail = `${combinedCounts}${combinedCounts ? " · " : ""}${i18n(button.dataset.statKey === "uv" ? I18nKey.visitsVisitors : I18nKey.visitsViews).replace("{count}", value)} · ${source}`;
							button.title = `${combinedCounts}${combinedCounts ? " · " : ""}${source}`;
							button.setAttribute("aria-busy", "false");
							const node =
								button.querySelector<HTMLElement>("[data-mobile-stat]");
							if (node) node.textContent = value;
						});
						syncPopup();
						visitCard
							?.querySelectorAll<HTMLElement>("[data-stat-source]")
							.forEach((node) => {
								node.textContent = SOURCE_NAME;
							});
						articleCounts.forEach((node) => {
							node.textContent = readCount(
								rawPagePv,
								Number(node.dataset.busuanziPageBase ?? 0),
							);
							node.title = node.dataset.busuanziPageBase
								? `${combinedCounts} · ${source}`
								: source;
							node.removeAttribute("aria-label");
							node.setAttribute("aria-busy", "false");
						});
					})
					.catch(() => {
						if (request === currentRequest)
							setStatus(i18n(I18nKey.visitsUnavailable));
					})
					.finally(() => {
						if (request !== currentRequest) return;
						clearTimeout(timeoutId);
						timeoutId = undefined;
						request = null;
					});
			},
			unmount() {
				const previousRequest = request;
				request = null;
				previousRequest?.abort();
				clearTimeout(timeoutId);
				timeoutId = undefined;
			},
		});
	});
}
