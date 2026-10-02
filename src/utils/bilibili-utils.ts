/** 构建期适配 LengxiQwQ/lengxiqwq-site 的公开追番接口，不读取 Cookie 或私人数据。 */
import sanitizeHtml from "sanitize-html";
import { lifeConfig } from "@/config";
import type { BilibiliAnime, BilibiliFollowSnapshot } from "@/types/bilibili";

const endpoint = "https://api.bilibili.com/x/space/bangumi/follow/list";
const pageSize = 30;
const maximumPages = 10;
const timeoutMs = 8_000;
let snapshotPromise: Promise<BilibiliFollowSnapshot> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
	return typeof value === "string"
		? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim()
		: "";
}

function coverUrl(value: unknown): string {
	if (typeof value !== "string") return "";
	try {
		const parsed = new URL(value.replace(/^http:\/\//, "https://"));
		return parsed.protocol === "https:" &&
			!parsed.username &&
			!parsed.password &&
			["hdslb.com", "bilibili.com"].some(
				(host) =>
					parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
			)
			? parsed.href
			: "";
	} catch {
		return "";
	}
}

function parseAnime(
	value: unknown,
	kind: BilibiliAnime["kind"],
): BilibiliAnime | null {
	if (
		!isRecord(value) ||
		typeof value.season_id !== "number" ||
		!Number.isSafeInteger(value.season_id) ||
		value.season_id <= 0
	)
		return null;
	const title = text(value.title);
	if (!title) return null;
	const score = isRecord(value.rating) ? value.rating.score : null;
	return {
		id: value.season_id,
		title,
		cover: coverUrl(value.cover),
		url: `https://www.bilibili.com/bangumi/play/ss${value.season_id}`,
		overview: text(value.evaluate || value.brief),
		progress: isRecord(value.new_ep) ? text(value.new_ep.index_show) : "",
		rating:
			typeof score === "number" &&
			Number.isFinite(score) &&
			score >= 0 &&
			score <= 10
				? score
				: null,
		kind,
	};
}

async function fetchByType(
	uid: string,
	kind: BilibiliAnime["kind"],
): Promise<BilibiliAnime[]> {
	const items: BilibiliAnime[] = [];
	for (let page = 1; page <= maximumPages; page += 1) {
		const requestUrl = new URL(endpoint);
		requestUrl.searchParams.set("vmid", uid);
		requestUrl.searchParams.set("type", kind === "anime" ? "1" : "2");
		requestUrl.searchParams.set("pn", String(page));
		requestUrl.searchParams.set("ps", String(pageSize));
		const response = await fetch(requestUrl, {
			signal: AbortSignal.timeout(timeoutMs),
		});
		if (!response.ok) throw new Error(`Bilibili HTTP ${response.status}`);
		const result: unknown = await response.json();
		if (
			!isRecord(result) ||
			result.code !== 0 ||
			!isRecord(result.data) ||
			!Array.isArray(result.data.list)
		)
			throw new Error("Bilibili public follow list unavailable");
		const list: unknown[] = result.data.list;
		for (const rawItem of list) {
			const item = parseAnime(rawItem, kind);
			if (item) items.push(item);
		}
		const total = result.data.total;
		if (
			list.length < pageSize ||
			(typeof total === "number" && page * pageSize >= total)
		)
			return items;
	}
	throw new Error("Bilibili follow list pagination limit exceeded");
}

async function loadSnapshot(): Promise<BilibiliFollowSnapshot> {
	if (!lifeConfig.bilibili.enabled) return { items: [], state: "disabled" };
	const uid = lifeConfig.bilibili.uid.trim();
	if (!/^\d+$/.test(uid)) return { items: [], state: "unconfigured" };
	try {
		const lists = await Promise.all([
			fetchByType(uid, "anime"),
			fetchByType(uid, "drama"),
		]);
		return {
			items: [...new Map(lists.flat().map((item) => [item.id, item])).values()],
			state: "success",
		};
	} catch {
		// 风控、隐私关闭、超时与网络故障不能伪装成真实的 0 部追番，也不能阻止全站构建。
		console.warn(
			"[bilibili] Public follow list unavailable; displaying explicit empty state.",
		);
		return { items: [], state: "unavailable" };
	}
}

export function getBilibiliFollowSnapshot(): Promise<BilibiliFollowSnapshot> {
	snapshotPromise ??= loadSnapshot();
	return snapshotPromise;
}
