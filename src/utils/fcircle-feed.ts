import dayjs from "dayjs";
import Parser from "rss-parser";
import sanitizeHtml from "sanitize-html";
import type { FriendLink } from "@/types/config";
import type { FcircleItem } from "@/types/fcircle";

const FEED_TIMEOUT_MS = 6000;
const MAX_FEED_REDIRECTS = 3;
const MAX_FEED_CHARACTERS = 2_000_000;
const MAX_ITEMS = 100;
const MAX_TITLE_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 180;
const MAX_TAG_LENGTH = 32;
const MAX_TAGS = 5;
const FEED_PATHS = ["/atom.xml", "/rss.xml", "/feed/", "/feed.xml"];

/** 只接受可公开链接的 HTTP(S) URL，拒绝脚本、凭证和显式本机地址。 */
function publicUrl(value: unknown, base?: string): string {
	if (typeof value !== "string" || !value.trim()) return "";
	try {
		const parsed = base ? new URL(value.trim(), base) : new URL(value.trim());
		if (
			!["http:", "https:"].includes(parsed.protocol) ||
			parsed.username ||
			parsed.password
		) {
			return "";
		}
		const hostname = parsed.hostname.toLowerCase();
		if (
			hostname === "localhost" ||
			hostname.endsWith(".localhost") ||
			hostname.endsWith(".local") ||
			hostname === "[::1]" ||
			/^\[(?:fc|fd|fe80)/.test(hostname)
		) {
			return "";
		}
		const octets = hostname.split(".").map(Number);
		if (
			octets.length === 4 &&
			octets.every(
				(part) => Number.isInteger(part) && part >= 0 && part <= 255,
			) &&
			(octets[0] === 0 ||
				octets[0] === 10 ||
				octets[0] === 127 ||
				(octets[0] === 169 && octets[1] === 254) ||
				(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
				(octets[0] === 192 && octets[1] === 168))
		) {
			return "";
		}
		parsed.hash = "";
		return parsed.href;
	} catch {
		return "";
	}
}

/** sanitize-html 输出会转义 &<>；解回文字后交给 Astro 的文本插值再统一转义。 */
function plainText(value: unknown, maxLength: number): string {
	if (typeof value !== "string") return "";
	const entities: Record<string, string> = {
		amp: "&",
		lt: "<",
		gt: ">",
		quot: '"',
		apos: "'",
	};
	return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
		.replace(
			/&(amp|lt|gt|quot|apos);/g,
			(match, entity: string) => entities[entity] || match,
		)
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, maxLength);
}

function normalizeItems(
	items: (Parser.Item & Record<string, unknown>)[],
	friend: FriendLink,
	feedUrl: string,
	friendUrl: string,
): FcircleItem[] {
	const result: FcircleItem[] = [];
	const friendName = plainText(friend.title, MAX_TITLE_LENGTH);
	const friendAvatar = publicUrl(friend.imgurl, friendUrl);
	const tags = (friend.tags ?? [])
		.map((tag) => plainText(tag, MAX_TAG_LENGTH))
		.filter(Boolean)
		.slice(0, MAX_TAGS);
	for (const item of items) {
		const title = plainText(item.title, MAX_TITLE_LENGTH);
		const guid =
			typeof item.guid === "string" && /^https?:\/\//i.test(item.guid)
				? item.guid
				: "";
		const articleLink = item.link || guid;
		// 仅锚点不是独立文章链接，也不应把 Feed 自身的查询参数带入页面。
		if (articleLink.trim().startsWith("#")) continue;
		const url = publicUrl(articleLink, feedUrl);
		const dateValue = item.isoDate || item.pubDate || item.date || item.updated;
		if (!title || !url || typeof dateValue !== "string") continue;
		const published = dayjs(dateValue);
		if (!published.isValid()) continue;
		const summary = plainText(
			item["content:encoded"] ||
				item.summary ||
				item.content ||
				item.contentSnippet ||
				item["content:encodedSnippet"],
			MAX_SUMMARY_LENGTH,
		);
		result.push({
			friendName,
			friendAvatar,
			friendUrl,
			title,
			url,
			publishedAt: published.toISOString(),
			summary,
			tags,
		});
	}
	return result;
}

async function readFriendFeed(friend: FriendLink): Promise<FcircleItem[]> {
	const friendUrl = publicUrl(friend.siteurl);
	if (!friendUrl) throw new Error("Invalid public site URL");
	const explicitFeed = friend.feedUrl?.trim();
	const candidates = explicitFeed
		? [publicUrl(explicitFeed, friendUrl)]
		: FEED_PATHS.map((path) => publicUrl(path, friendUrl));
	for (const candidate of candidates) {
		if (!candidate) continue;
		try {
			let requestUrl = candidate;
			let response: Response | null = null;
			const signal = AbortSignal.timeout(FEED_TIMEOUT_MS);
			for (let hop = 0; hop <= MAX_FEED_REDIRECTS; hop++) {
				response = await fetch(requestUrl, {
					headers: {
						Accept:
							"application/rss+xml, application/atom+xml, application/xml, text/xml",
						"User-Agent": "SoraGinko FeedReader/1.0",
					},
					redirect: "manual",
					signal,
				});
				if (![301, 302, 303, 307, 308].includes(response.status)) break;
				const nextUrl = publicUrl(response.headers.get("Location"), requestUrl);
				await response.body?.cancel();
				if (!nextUrl || hop === MAX_FEED_REDIRECTS) {
					throw new Error("Invalid or excessive feed redirect");
				}
				requestUrl = nextUrl;
			}
			if (!response?.ok) throw new Error("Feed HTTP request failed");
			const finalUrl = publicUrl(response.url || requestUrl);
			if (!finalUrl) throw new Error("Invalid public feed URL");
			const xml = await response.text();
			if (xml.length > MAX_FEED_CHARACTERS)
				throw new Error("Feed exceeded size limit");
			// 每次解析使用独立实例，不让并行站点共享 xml2js 的解析状态。
			const parser = new Parser<
				Record<string, unknown>,
				Record<string, unknown>
			>({
				customFields: { item: ["date", "updated"] },
			});
			const feed = await parser.parseString(xml);
			// 有效但没有文章的 Feed 是正常空态，不继续探测或填充假内容。
			return normalizeItems(feed.items, friend, finalUrl, friendUrl);
		} catch {
			// 按约定顺序尝试其余地址；站点级警告统一由聚合入口输出一次。
		}
	}
	throw new Error("No usable RSS or Atom feed");
}

/** 唯一名单由 friendsConfig 调用方提供；失败站点不会阻断其他站点或全站构建。 */
export async function buildFcircleFeed(
	friends: readonly FriendLink[],
): Promise<FcircleItem[]> {
	const enabledFriends = friends.filter((friend) => friend.enabled === true);
	const results = await Promise.allSettled(enabledFriends.map(readFriendFeed));
	const items: FcircleItem[] = [];
	for (const [index, result] of results.entries()) {
		if (result.status === "fulfilled") {
			items.push(...result.value);
		} else {
			// 不打印 Feed 地址或异常内容，避免配置的查询参数进入构建日志。
			console.warn(
				`[fcircle] ${plainText(enabledFriends[index].title, MAX_TITLE_LENGTH)}: Feed unavailable.`,
			);
		}
	}
	items.sort(
		(a, b) => dayjs(b.publishedAt).valueOf() - dayjs(a.publishedAt).valueOf(),
	);
	const seen = new Set<string>();
	return items
		.filter((item) => {
			const parsed = new URL(item.url);
			// 保留大小写敏感路径和查询参数；只合并同一地址的尾斜杠差异。
			parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
			const key = parsed.href;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.slice(0, MAX_ITEMS);
}
