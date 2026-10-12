import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import {
	definePageIsland,
	definePersistentIsland,
} from "@/utils/swup-lifecycle";

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
				const newService = i18n(I18nKey.visitsNewService);
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
					// 新源不可用时不拿历史数字冒充新源；历史快照由独立节点始终展示。
					const statusDetail = `${newService} · ${message} · ${source}`;
					if (detail) {
						detail.textContent = statusDetail;
						detail.setAttribute("aria-busy", String(isLoading));
					}
					mobileButtons.forEach((button) => {
						button.dataset.popupValue = "--";
						button.dataset.popupDetail = statusDetail;
						button.title = statusDetail;
						button.setAttribute("aria-busy", String(isLoading));
						const node =
							button.querySelector<HTMLElement>("[data-mobile-stat]");
						if (node) node.textContent = "--";
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
							node.textContent = "--";
						});
					articleCounts.forEach((node) => {
						node.textContent = isLoading
							? i18n(I18nKey.pageViewsLoading)
							: "--";
						node.title = statusDetail;
						node.setAttribute("aria-label", statusDetail);
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
						const uv = readCount("site_uv" in data ? data.site_uv : null);
						const pv = readCount("site_pv" in data ? data.site_pv : null);
						const pagePv = readCount("page_pv" in data ? data.page_pv : null);
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
							detail.textContent = `${newService} · ${i18n(I18nKey.visitsSummary).replace("{uv}", uv).replace("{pv}", pv)} · ${source}`;
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
							button.dataset.popupDetail = `${newService} · ${i18n(button.dataset.statKey === "uv" ? I18nKey.visitsVisitors : I18nKey.visitsViews).replace("{count}", value)} · ${source}`;
							button.title = `${newService} · ${source}`;
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
							node.textContent = pagePv;
							node.title = `${newService} · ${source}`;
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
