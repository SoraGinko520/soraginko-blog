// 基于 MmzMing/my-blog 的 process-friend-request.cjs（MIT），保留表单解析、
// 可达性/回链校验与 Issue 反馈流程；SoraGinko 改为人工批准后写入默认分支。
const fs = require("node:fs");
const path = require("node:path");
const dns = require("node:dns/promises");
const net = require("node:net");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const { chromium } = require("playwright");

const FRIENDS_CONFIG_RELATIVE_PATH = "src/config/friendsConfig.ts";
const SITE_INFO = {
	name: "SoraGinko",
	url: "https://soraginko.moe",
	avatar:
		"https://soraginko.moe/assets/images/home/silver-author-avatar.5242def51b6f.webp",
	desc: "记录技术、学习与生活的个人博客。",
};
const DEFAULT_TAG = "Blog";
const MAX_CHECKS = 4;
const DNS_TIMEOUT = 5000;
const PAGE_TIMEOUT = 12000;
const MAX_REQUESTS = 150;
const CHECK_MARKER = "<!-- sora-friend-check:";
const INFRASTRUCTURE_MARKER = "<!-- sora-friend-infrastructure -->";
const LABELS = {
	"friend-link": "72b8db",
	"needs-update": "d4933b",
	待审核: "5f91b0",
};

class FriendCheckInfrastructureError extends Error {
	constructor(cause) {
		super("友链检查机器人的浏览器运行环境异常。", { cause });
		this.name = "FriendCheckInfrastructureError";
	}
}

async function launchValidationBrowser() {
	// 浏览器进程只得到运行所需环境，不继承 GitHub token/Action 凭据。
	const browserEnv = Object.fromEntries(
		[
			"PATH",
			"HOME",
			"LANG",
			"TMPDIR",
			"XDG_CACHE_HOME",
			"PLAYWRIGHT_BROWSERS_PATH",
		]
			.filter((key) => process.env[key])
			.map((key) => [key, process.env[key]]),
	);
	try {
		return await chromium.launch({
			headless: true,
			chromiumSandbox: true,
			env: browserEnv,
		});
	} catch (error) {
		throw new FriendCheckInfrastructureError(error);
	}
}

function isPublicAddress(address) {
	if (net.isIP(address) === 4) {
		const [a, b] = address.split(".").map(Number);
		return !(
			a === 0 ||
			a === 10 ||
			a === 127 ||
			a >= 224 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && (b === 168 || b === 0)) ||
			(a === 198 && (b === 18 || b === 19))
		);
	}
	if (net.isIP(address) === 6) {
		const value = address.toLowerCase();
		return /^[23]/.test(value) && !value.startsWith("2001:db8:");
	}
	return false;
}

function normalizeUrl(value) {
	if (typeof value !== "string" || !value.trim() || value.length > 2048)
		return "";
	try {
		const parsed = new URL(value.trim());
		const host = parsed.hostname
			.replace(/^\[|\]$/g, "")
			.replace(/\.$/, "")
			.toLowerCase();
		if (
			!["http:", "https:"].includes(parsed.protocol) ||
			parsed.username ||
			parsed.password
		)
			return "";
		if (!host.includes(".") && !net.isIP(host)) return "";
		if (host === "localhost" || /\.(localhost|local|internal)$/.test(host))
			return "";
		if (net.isIP(host) && !isPublicAddress(host)) return "";
		parsed.hash = "";
		return parsed.href;
	} catch {
		return "";
	}
}

async function assertPublicUrl(value) {
	const normalized = normalizeUrl(value);
	if (!normalized) throw new Error("仅接受不含账号密码的公开 HTTP(S) 地址。");
	const host = new URL(normalized).hostname.replace(/^\[|\]$/g, "");
	if (net.isIP(host)) return normalized;
	let timer;
	try {
		const records = await Promise.race([
			dns.lookup(host, { all: true }),
			new Promise((_, reject) => {
				timer = setTimeout(
					() => reject(new Error("域名解析超时。")),
					DNS_TIMEOUT,
				);
			}),
		]);
		if (
			!records.length ||
			records.some((record) => !isPublicAddress(record.address))
		) {
			throw new Error("不接受解析到本机或私有网络的地址。");
		}
		return normalized;
	} finally {
		clearTimeout(timer);
	}
}

function parseIssueBody(body) {
	const data = {
		site_name: "",
		site_url: "",
		friend_page_url: "",
		site_desc: "",
		site_avatar: "",
		site_image: "",
		site_tag: DEFAULT_TAG,
	};
	const fields = [
		[/网站名称|站点名称|^名称$/, "site_name"],
		[/友链页面|友链地址/, "friend_page_url"],
		[/网站链接|站点链接|^链接$|网址|地址/, "site_url"],
		[/网站描述|描述|简介/, "site_desc"],
		[/网站头像|头像|图标/, "site_avatar"],
		[/封面/, "site_image"],
		[/网站标签|标签|分类/, "site_tag"],
	];
	let pendingField = null;
	const assignField = (field, value) => {
		const trimmed = value.trim();
		if (!trimmed || trimmed === "_No response_") return;
		const isUrl = [
			"site_url",
			"friend_page_url",
			"site_avatar",
			"site_image",
		].includes(field);
		const normalized = isUrl ? normalizeUrl(trimmed) : trimmed;
		if (!normalized) throw new Error("网址无效，或不是公开的 HTTP(S) 地址。");
		data[field] = normalized;
	};
	for (const raw of body.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) continue;
		if (/^#+\s/.test(line)) {
			const label = line.replace(/^#+\s*/, "");
			pendingField =
				fields.find(([pattern]) => pattern.test(label))?.[1] ?? null;
			continue;
		}
		if (pendingField) {
			assignField(pendingField, line);
			pendingField = null;
			continue;
		}
		const separator = line.search(/[:：]/);
		if (separator < 0) continue;
		const field = fields.find(([pattern]) =>
			pattern.test(line.slice(0, separator)),
		)?.[1];
		if (field) assignField(field, line.slice(separator + 1));
	}
	return data;
}

function propertyName(property) {
	return property.name &&
		(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
		? property.name.text
		: "";
}

function findFriendsArray(content) {
	const source = ts.createSourceFile(
		FRIENDS_CONFIG_RELATIVE_PATH,
		content,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	if (source.parseDiagnostics.length)
		throw new Error("友链配置存在语法错误，不能自动修改。");
	for (const statement of source.statements) {
		if (!ts.isVariableStatement(statement)) continue;
		for (const declaration of statement.declarationList.declarations) {
			if (
				ts.isIdentifier(declaration.name) &&
				declaration.name.text === "friendsConfig" &&
				declaration.initializer &&
				ts.isArrayLiteralExpression(declaration.initializer)
			) {
				return { source, array: declaration.initializer };
			}
		}
	}
	throw new Error("未找到 friendsConfig 数组。");
}

function literal(value) {
	return JSON.stringify(value)
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

// 不 eval 配置，不重排其他条目；更新时仅替换匹配站点的提交字段，权重/启用状态原样保留。
function updateFriendsContent(content, data) {
	const { source, array } = findFriendsArray(content);
	const values = {
		title: data.site_name,
		imgurl: data.site_avatar,
		desc: data.site_desc,
		siteurl: data.site_url,
		tags: [data.site_tag || DEFAULT_TAG],
	};
	if (data.site_image) values.image = data.site_image;
	const canonical = (value) => normalizeUrl(value).replace(/\/$/, "");
	let existing;
	for (const item of array.elements) {
		if (!ts.isObjectLiteralExpression(item))
			throw new Error("友链数组包含动态条目，请人工处理。");
		const site = item.properties.find(
			(property) => propertyName(property) === "siteurl",
		);
		if (
			!site ||
			!ts.isPropertyAssignment(site) ||
			!ts.isStringLiteralLike(site.initializer)
		) {
			throw new Error("友链条目缺少静态 siteurl，请人工处理。");
		}
		if (canonical(site.initializer.text) === canonical(data.site_url))
			existing = item;
	}
	const eol = content.includes("\r\n") ? "\r\n" : "\n";
	if (!existing) {
		const fields = { ...values, weight: 5, enabled: true };
		const rendered = Object.entries(fields)
			.map(([key, value]) => `\t\t${key}: ${literal(value)},`)
			.join(eol);
		const separator =
			array.elements.length && !array.elements.hasTrailingComma ? "," : "";
		const position = array.getEnd() - 1;
		return `${content.slice(0, position)}${separator}${eol}\t{${eol}${rendered}${eol}\t},${eol}${content.slice(position)}`;
	}
	const changes = [];
	const missing = [];
	for (const [key, value] of Object.entries(values)) {
		const property = existing.properties.find(
			(item) => propertyName(item) === key,
		);
		if (property) {
			if (!ts.isPropertyAssignment(property))
				throw new Error("友链条目含动态字段，请人工处理。");
			changes.push({
				start: property.initializer.getStart(source),
				end: property.initializer.getEnd(),
				text: literal(value),
			});
		} else {
			missing.push(`\t\t${key}: ${literal(value)},`);
		}
	}
	if (missing.length) {
		const prefix =
			existing.properties.length && !existing.properties.hasTrailingComma
				? ","
				: "";
		changes.push({
			start: existing.getEnd() - 1,
			end: existing.getEnd() - 1,
			text: `${prefix}${eol}${missing.join(eol)}${eol}\t`,
		});
	}
	return changes
		.sort((a, b) => b.start - a.start)
		.reduce(
			(result, change) =>
				result.slice(0, change.start) + change.text + result.slice(change.end),
			content,
		);
}

async function validateFriendPage(pageUrl) {
	await assertPublicUrl(pageUrl);
	let browser;
	let browserContext;
	try {
		browser = await launchValidationBrowser();
		browserContext = await browser.newContext({
			serviceWorkers: "block",
			acceptDownloads: false,
		});
		let requestCount = 0;
		const checkedHosts = new Map();
		await browserContext.route("**/*", async (route) => {
			try {
				requestCount += 1;
				if (
					requestCount > MAX_REQUESTS ||
					["media", "font"].includes(route.request().resourceType())
				)
					return await route.abort();
				const requestUrl = normalizeUrl(route.request().url());
				if (!requestUrl) return await route.abort();
				const host = new URL(requestUrl).hostname;
				if (!checkedHosts.has(host))
					checkedHosts.set(host, assertPublicUrl(requestUrl));
				await checkedHosts.get(host);
				await route.continue();
			} catch {
				await route.abort();
			}
		});
		const page = await browserContext.newPage();
		const response = await page.goto(pageUrl, {
			waitUntil: "domcontentloaded",
			timeout: PAGE_TIMEOUT,
		});
		if (!response?.ok()) return { ok: false, reason: "友链页面无法正常访问。" };
		await assertPublicUrl(page.url());
		const host = new URL(SITE_INFO.url).hostname;
		try {
			await page.waitForFunction(
				(expectedHost) =>
					Array.from(document.querySelectorAll("a[href]")).some((item) => {
						try {
							const link = new URL(item.href);
							return (
								["http:", "https:"].includes(link.protocol) &&
								link.hostname === expectedHost
							);
						} catch {
							return false;
						}
					}),
				host,
				{ timeout: 5000 },
			);
		} catch (error) {
			if (!browser.isConnected())
				throw new FriendCheckInfrastructureError(error);
			return {
				ok: false,
				reason:
					"未找到真正链接到 soraginko.moe 的 a 标签；仅包含名称或网址文本不能通过。",
			};
		}
		return { ok: true };
	} catch (error) {
		if (error instanceof FriendCheckInfrastructureError) throw error;
		if (!browser?.isConnected())
			throw new FriendCheckInfrastructureError(error);
		return {
			ok: false,
			reason: "友链页面访问超时或连接失败，请检查页面是否可公开访问。",
		};
	} finally {
		try {
			await browserContext?.close();
		} catch {
			// 浏览器异常退出时上下文可能已关闭，不让清理错误覆盖检查结论。
		}
		try {
			await browser?.close();
		} catch {
			// 已退出的进程无需重复关闭。
		}
	}
}

async function addLabels(github, owner, repo, issueNumber, labels) {
	for (const name of labels) {
		try {
			await github.rest.issues.getLabel({ owner, repo, name });
		} catch (error) {
			if (error.status !== 404) throw error;
			try {
				await github.rest.issues.createLabel({
					owner,
					repo,
					name,
					color: LABELS[name] || "72b8db",
				});
			} catch (createdError) {
				if (createdError.status !== 422) throw createdError;
			}
		}
	}
	await github.rest.issues.addLabels({
		owner,
		repo,
		issue_number: issueNumber,
		labels,
	});
}

async function removeLabelIfExists(github, owner, repo, issueNumber, name) {
	try {
		await github.rest.issues.removeLabel({
			owner,
			repo,
			issue_number: issueNumber,
			name,
		});
	} catch (error) {
		if (error.status !== 404) throw error;
	}
}

function run(command, args, repoRoot) {
	const result = spawnSync(command, args, {
		cwd: repoRoot,
		stdio: "inherit",
		shell: false,
	});
	if (result.error || result.status !== 0)
		throw new Error(
			"配置静态检查或构建未通过，未写入仓库；请站长查看工作流日志。",
		);
}

async function publishFriendsConfig(github, context, data, issueBody) {
	const repoRoot = process.env.GITHUB_WORKSPACE || process.cwd();
	const filePath = path.join(repoRoot, FRIENDS_CONFIG_RELATIVE_PATH);
	const original = fs.readFileSync(filePath, "utf8");
	const updated = updateFriendsContent(original, data);
	fs.writeFileSync(filePath, updated, "utf8");
	run(
		"pnpm",
		["exec", "biome", "check", "--write", FRIENDS_CONFIG_RELATIVE_PATH],
		repoRoot,
	);
	run("pnpm", ["type-check"], repoRoot);
	run("pnpm", ["check"], repoRoot);
	run("pnpm", ["build"], repoRoot);
	const nextContent = fs.readFileSync(filePath, "utf8");
	const { owner, repo } = context.repo;
	const latestIssue = await github.rest.issues.get({
		owner,
		repo,
		issue_number: context.payload.issue.number,
	});
	if (latestIssue.data.body !== issueBody || latestIssue.data.state !== "open")
		throw new Error("检查期间申请内容或状态已改变，请重新审核并批准。");
	const repository = await github.rest.repos.get({ owner, repo });
	const branch = repository.data.default_branch;
	const current = await github.rest.repos.getContent({
		owner,
		repo,
		path: FRIENDS_CONFIG_RELATIVE_PATH,
		ref: branch,
	});
	if (Array.isArray(current.data) || current.data.type !== "file")
		throw new Error("仓库中的友链配置不是文件。");
	const remote = Buffer.from(current.data.content, "base64").toString("utf8");
	if (remote !== original)
		throw new Error("默认分支友链配置已改变，请重新批准，避免覆盖其他修改。");
	if (nextContent === remote) return false;
	await github.rest.repos.createOrUpdateFileContents({
		owner,
		repo,
		path: FRIENDS_CONFIG_RELATIVE_PATH,
		branch,
		sha: current.data.sha,
		message: `chore: 审核收录友链 #${context.payload.issue.number}`,
		content: Buffer.from(nextContent).toString("base64"),
	});
	return true;
}

module.exports = async function processFriendRequest({
	github,
	context,
	core,
	browserReady = true,
}) {
	const payloadIssue = context.payload.issue;
	if (
		!payloadIssue ||
		payloadIssue.pull_request ||
		context.payload.comment?.user?.type === "Bot"
	)
		return;
	const { owner, repo } = context.repo;
	const issueNumber = payloadIssue.number;
	const issue = (
		await github.rest.issues.get({ owner, repo, issue_number: issueNumber })
	).data;
	if (
		issue.pull_request ||
		issue.state !== "open" ||
		issue.user?.type === "Bot"
	)
		return;
	const body = issue.body || "";
	if (
		!body.includes("### 网站名称") ||
		!body.includes("### 网站链接") ||
		body.length > 8192
	)
		return;
	const commentEvent = context.eventName === "issue_comment";
	const command = context.payload.comment?.body?.trim() || "";
	const approving = commentEvent && command === "/approve-friend";
	if (commentEvent) {
		const actor = context.payload.comment.user.login;
		if (approving) {
			const permission = await github.rest.repos.getCollaboratorPermissionLevel(
				{ owner, repo, username: actor },
			);
			if (
				!["write", "admin", "maintain"].includes(permission.data.permission) &&
				permission.data.role_name !== "maintain"
			)
				return;
		} else if (command !== "/recheck-friend" || actor !== issue.user.login)
			return;
	}
	const comments = await github.paginate(github.rest.issues.listComments, {
		owner,
		repo,
		issue_number: issueNumber,
		per_page: 100,
	});
	const checks = comments.filter(
		(item) =>
			item.user?.type === "Bot" &&
			item.body?.includes(CHECK_MARKER) &&
			// 兼容修复前的评论，启动失败不消耗申请人的检查次数。
			!item.body.includes("browserType.launch:") &&
			!item.body.includes("Chromium sandboxing failed"),
	).length;
	if (browserReady && !approving && checks >= MAX_CHECKS) {
		core?.notice("此申请已达到自动检查次数上限，等待站长处理。");
		return;
	}
	const marker = `${CHECK_MARKER}${checks + 1} -->`;
	const reply = (text) =>
		github.rest.issues.createComment({
			owner,
			repo,
			issue_number: issueNumber,
			body: `${marker}\n${text}`,
		});
	try {
		if (!browserReady) throw new FriendCheckInfrastructureError();
		await addLabels(github, owner, repo, issueNumber, ["friend-link"]);
		const data = parseIssueBody(body);
		if (
			!data.site_name ||
			!data.site_url ||
			!data.friend_page_url ||
			!data.site_avatar ||
			!data.site_desc ||
			data.site_name.length > 80 ||
			data.site_desc.length > 280 ||
			data.site_tag.length > 30
		) {
			throw new Error(
				"请完整填写名称、网站链接、头像、描述和友链页面；名称≤80字，描述≤280字，标签≤30字。",
			);
		}
		for (const value of [
			data.site_url,
			data.friend_page_url,
			data.site_avatar,
			data.site_image,
		].filter(Boolean))
			await assertPublicUrl(value);
		const siteHost = new URL(data.site_url).hostname.replace(/^www\./, "");
		const friendHost = new URL(data.friend_page_url).hostname.replace(
			/^www\./,
			"",
		);
		if (
			siteHost !== friendHost ||
			siteHost === new URL(SITE_INFO.url).hostname
		) {
			throw new Error(
				"友链页面须属于申请网站本身，不能借用本站或其他网站的回链。",
			);
		}
		const validation = await validateFriendPage(data.friend_page_url);
		if (!validation.ok) throw new Error(validation.reason);
		if (!approving) {
			await addLabels(github, owner, repo, issueNumber, ["待审核"]);
			await removeLabelIfExists(
				github,
				owner,
				repo,
				issueNumber,
				"needs-update",
			);
			await reply(
				"✅ 公开访问和回链检查通过，当前仍待人工审核，尚未写入友链。站长或具有写权限的协作者可回复 `/approve-friend`；申请人修改内容后可回复 `/recheck-friend`。",
			);
			return;
		}
		const changed = await publishFriendsConfig(github, context, data, body);
		await reply(
			changed
				? "✅ 人工批准及静态检查通过，友链配置已写入默认分支。线上显示取决于后续部署，这条消息不代表已经上线。"
				: "✅ 人工审核通过，友链配置已经一致，无需重复写入。",
		);
		await removeLabelIfExists(github, owner, repo, issueNumber, "待审核");
		await removeLabelIfExists(github, owner, repo, issueNumber, "needs-update");
		await github.rest.issues.update({
			owner,
			repo,
			issue_number: issueNumber,
			state: "closed",
			state_reason: "completed",
		});
	} catch (error) {
		if (error instanceof FriendCheckInfrastructureError) {
			const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`;
			await github.rest.issues.createComment({
				owner,
				repo,
				issue_number: issueNumber,
				body: `${INFRASTRUCTURE_MARKER}\n⚠️ 友链检查机器人的浏览器运行环境异常，尚未完成回链检查。这不表示你的申请信息或回链有问题，也不会消耗申请检查次数。\n\n请站长查看 [Actions 日志](${runUrl}) 并修复环境。修复后，申请人可回复 \`/recheck-friend\`，批准操作需站长再次回复 \`/approve-friend\`。本次未写入友链配置。`,
			});
			// 不改变原有审核标签；详细启动日志只留在 Actions，不贴到申请评论。
			core?.error(error.cause?.stack || error.stack);
			core?.setFailed(error.message);
			return;
		}
		await addLabels(github, owner, repo, issueNumber, ["needs-update"]);
		await removeLabelIfExists(github, owner, repo, issueNumber, "待审核");
		const message =
			error instanceof Error
				? error.message
				: "检查失败，请站长查看工作流日志。";
		await reply(
			`❌ ${message}\n\n请检查申请信息和回链，申请人可修改本 Issue 后回复 \`/recheck-friend\`。批准失败需站长再次回复 \`/approve-friend\`。`,
		);
		core?.warning(message);
		if (approving) core?.setFailed(message);
	}
};

// 工作流仅访问空白页预检，复用与真实友链检查一致的沙箱和环境白名单。
module.exports.checkBrowserEnvironment =
	async function checkBrowserEnvironment() {
		const browser = await launchValidationBrowser();
		try {
			await browser.newPage();
		} finally {
			await browser.close();
		}
	};
