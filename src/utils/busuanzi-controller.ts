import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import {
	definePageIsland,
	definePersistentIsland,
} from "@/utils/swup-lifecycle";

// 与 busuanzi.cc 3.6.9 公共脚本使用同一计数协议；不同时加载脚本，避免重复计数。
const BUSUANZI_ENDPOINT = "https://cdn.busuanzi.cc/api.php";
const REQUEST_TIMEOUT_MS = 10_000;
const SOURCE_NAME = "不蒜子";

function readCount(value: unknown): string | null {
	if (typeof value !== "number" && typeof value !== "string") return null;
	if (typeof value === "string" && !/^\d+$/.test(value)) return null;
	const count = Number(value);
	return Number.isSafeInteger(count) && count >= 0
		? count.toLocaleString()
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
					if (detail) {
						detail.textContent = `${message} · ${source}`;
						detail.setAttribute("aria-busy", String(isLoading));
					}
					mobileButtons.forEach((button) => {
						button.dataset.popupValue = "--";
						button.dataset.popupDetail = `${message} · ${source}`;
						button.title = message;
						button.setAttribute("aria-busy", String(isLoading));
						const node =
							button.querySelector<HTMLElement>("[data-mobile-stat]");
						if (node) node.textContent = "--";
					});
					visitCard
						?.querySelectorAll<HTMLElement>(
							'[data-stat-value="UV"], [data-stat-value="PV"]',
						)
						.forEach((node) => {
							node.textContent = "--";
						});
					articleCounts.forEach((node) => {
						node.textContent = isLoading
							? i18n(I18nKey.pageViewsLoading)
							: "--";
						node.title = `${message} · ${source}`;
						node.setAttribute("aria-label", `${message} · ${source}`);
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

				const currentRequest = new AbortController();
				request = currentRequest;
				timeoutId = setTimeout(
					() => currentRequest.abort(),
					REQUEST_TIMEOUT_MS,
				);
				setStatus(i18n(I18nKey.visitsLoading), true);
				// 不重试计数 POST；每代 mount 仅发一次，滚动、展开卡片和调整尺寸不计数。
				void fetch(BUSUANZI_ENDPOINT, {
					method: "POST",
					credentials: "omit",
					body: JSON.stringify({
						// 忽略查询参数和锚点，同一文章分享链接不拆成多套计数。
						url: new URL(location.pathname, location.origin).href,
						referrer: document.referrer
							? new URL(document.referrer).origin
							: "",
					}),
					signal: currentRequest.signal,
				})
					.then(async (response) => {
						if (!response.ok) throw new Error("Busuanzi response failed");
						const data: unknown = await response.json();
						if (!data || typeof data !== "object")
							throw new Error("Invalid counts");
						const uv = readCount(
							"busuanzi_site_uv" in data ? data.busuanzi_site_uv : null,
						);
						const pv = readCount(
							"busuanzi_site_pv" in data ? data.busuanzi_site_pv : null,
						);
						const pagePv = readCount(
							"busuanzi_page_pv" in data ? data.busuanzi_page_pv : null,
						);
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
							button.dataset.popupDetail = `${i18n(button.dataset.statKey === "uv" ? I18nKey.visitsVisitors : I18nKey.visitsViews).replace("{count}", value)} · ${source}`;
							button.title = source;
							button.setAttribute("aria-busy", "false");
							const node =
								button.querySelector<HTMLElement>("[data-mobile-stat]");
							if (node) node.textContent = value;
						});
						syncPopup();
						articleCounts.forEach((node) => {
							node.textContent = pagePv;
							node.title = source;
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
