/** 构建期模块：仅由 Astro frontmatter 引用，绝不从客户端控制器导入。 */
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sanitizeHtml from "sanitize-html";
import { projectsConfig } from "@/config";
import I18nKey from "@/i18n/i18nKey";
import type {
	GithubProjectsCache,
	GithubRepository,
	PendingFeaturedProject,
	Project,
	ProjectStatus,
	ProjectsSnapshot,
} from "@/types/projects";

const githubOwner = "SoraGinko520" as const;
const githubApi = "https://api.github.com";
const repositoriesPerPage = 100;
const maximumPages = 50;
const requestTimeoutMs = 10_000;
const maximumTextLength = 2_000;
const maximumFeatured = 4;
const cachePath = path.resolve("src/constants/github-projects.json");
const escapedText: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#39;": "'",
};

let snapshotPromise: Promise<ProjectsSnapshot> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function plainText(value: unknown): string {
	return typeof value === "string"
		? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
				// 返回纯文本，Astro 模板在输出时统一转义，避免 &amp; 二次编码。
				.replace(
					/&(amp|lt|gt|quot|#39);/g,
					(entity) => escapedText[entity] ?? entity,
				)
				.trim()
				.slice(0, maximumTextLength)
		: "";
}

function safeExternalUrl(value: unknown): string {
	if (typeof value !== "string" || !value.trim()) return "";
	try {
		const parsed = new URL(value.trim());
		return ["https:", "http:"].includes(parsed.protocol) &&
			!parsed.username &&
			!parsed.password
			? parsed.href
			: "";
	} catch {
		return "";
	}
}

function isDate(value: unknown): value is string {
	return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function count(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value)
		? Math.max(0, Math.floor(value))
		: 0;
}

/** 同时验证 API 和缓存：拒绝其他账号、私有仓库及非仓库路径。 */
function parseRepository(value: unknown): GithubRepository | null {
	if (!isRecord(value)) return null;
	if (
		typeof value.name !== "string" ||
		!/[A-Za-z0-9]/.test(value.name) ||
		!/^[A-Za-z0-9_.-]+$/.test(value.name) ||
		typeof value.full_name !== "string" ||
		value.full_name.toLowerCase() !==
			`${githubOwner}/${value.name}`.toLowerCase() ||
		(value.visibility !== undefined && value.visibility !== "public") ||
		value.private === true ||
		(value.visibility !== "public" && value.private !== false) ||
		!isDate(value.created_at) ||
		!isDate(value.updated_at) ||
		typeof value.archived !== "boolean" ||
		typeof value.fork !== "boolean"
	) {
		return null;
	}
	const expectedUrl = `https://github.com/${githubOwner}/${value.name}`;
	if (safeExternalUrl(value.html_url).replace(/\/$/, "") !== expectedUrl) {
		return null;
	}
	return {
		name: value.name,
		full_name: `${githubOwner}/${value.name}`,
		html_url: expectedUrl,
		homepage: safeExternalUrl(value.homepage) || null,
		description: plainText(value.description) || null,
		language: plainText(value.language) || null,
		topics: Array.isArray(value.topics)
			? [...new Set(value.topics.map(plainText).filter(Boolean))]
			: [],
		stargazers_count: count(value.stargazers_count),
		forks_count: count(value.forks_count),
		created_at: value.created_at,
		updated_at: value.updated_at,
		archived: value.archived,
		fork: value.fork,
		visibility: "public",
	};
}

async function readCache(): Promise<GithubProjectsCache | null> {
	try {
		const value: unknown = JSON.parse(await readFile(cachePath, "utf8"));
		if (
			!isRecord(value) ||
			value.owner !== githubOwner ||
			!isDate(value.fetchedAt) ||
			!Array.isArray(value.repositories)
		) {
			return null;
		}
		const repositories = value.repositories
			.map(parseRepository)
			.filter((repository) => repository !== null);
		return { owner: githubOwner, fetchedAt: value.fetchedAt, repositories };
	} catch {
		// 尚未同步、文件缺失或缓存损坏都按无缓存处理，不能阻断整站构建。
		return null;
	}
}

async function fetchRepositories(): Promise<GithubRepository[]> {
	const repositories = new Map<string, GithubRepository>();
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": "SoraGinko-blog-build",
	};
	// 可选构建端环境变量；不写入缓存、HTML、日志或任何客户端代码。
	const token = (
		import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN
	)?.trim();
	if (token) headers.Authorization = `Bearer ${token}`;

	for (let page = 1; page <= maximumPages; page += 1) {
		const endpoint = new URL(`/users/${githubOwner}/repos`, githubApi);
		endpoint.searchParams.set("per_page", String(repositoriesPerPage));
		endpoint.searchParams.set("page", String(page));
		endpoint.searchParams.set("sort", "updated");
		endpoint.searchParams.set("direction", "desc");
		const response = await fetch(endpoint, {
			headers,
			signal: AbortSignal.timeout(requestTimeoutMs),
		});
		if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
		const data: unknown = await response.json();
		if (!Array.isArray(data)) throw new Error("GitHub response is not a list");
		for (const entry of data) {
			const repository = parseRepository(entry);
			if (repository)
				repositories.set(repository.name.toLowerCase(), repository);
		}
		if (data.length < repositoriesPerPage) return [...repositories.values()];
	}
	// 不把截断的分页结果误标记为完整成功缓存。
	throw new Error("GitHub repository pagination limit exceeded");
}

function containsName(names: string[], name: string): boolean {
	return names.some((entry) => entry.toLowerCase() === name.toLowerCase());
}

function createProjects(repositories: GithubRepository[]): Project[] {
	const overrideEntries = Object.entries(projectsConfig.overrides);
	return repositories
		.flatMap((repository): Project[] => {
			const override = overrideEntries.find(
				([name]) => name.toLowerCase() === repository.name.toLowerCase(),
			)?.[1];
			if (
				containsName(projectsConfig.hidden, repository.name) ||
				override?.hidden ||
				(repository.fork &&
					!containsName(projectsConfig.includeForks, repository.name))
			) {
				return [];
			}
			const status: ProjectStatus = repository.archived
				? "archived"
				: (override?.status ?? "published");
			const order = override?.order ?? override?.sort;
			return [
				{
					slug: repository.name.toLowerCase(),
					name: repository.name,
					fullName: repository.full_name,
					title: plainText(override?.title) || repository.name,
					description: plainText(
						override?.description ?? repository.description,
					),
					githubUrl: repository.html_url,
					demoUrl: safeExternalUrl(override?.demo ?? repository.homepage),
					cover: override?.cover?.trim() || "",
					language: repository.language || "",
					tags: [
						...new Set(
							(override?.tags ?? repository.topics)
								.map(plainText)
								.filter(Boolean),
						),
					],
					status,
					stars: repository.stargazers_count,
					forks: repository.forks_count,
					createdAt: repository.created_at,
					updatedAt: repository.updated_at,
					featured:
						override?.featured ??
						containsName(projectsConfig.featured, repository.name),
					sort: Number.isFinite(order) ? (order ?? 0) : 0,
				},
			];
		})
		.sort(
			(left, right) =>
				right.sort - left.sort ||
				Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
		);
}

async function loadSnapshot(): Promise<ProjectsSnapshot> {
	const cache = await readCache();
	try {
		const repositories = await fetchRepositories();
		const fetchedAt = new Date().toISOString();
		const nextCache: GithubProjectsCache = {
			owner: githubOwner,
			fetchedAt,
			repositories,
		};
		const pendingCachePath = `${cachePath}.${process.pid}.tmp`;
		try {
			// 同目录原子替换：保存中断时仍保留上次完整成功缓存。
			await writeFile(
				pendingCachePath,
				`${JSON.stringify(nextCache, null, "\t")}\n`,
				"utf8",
			);
			await rename(pendingCachePath, cachePath);
		} catch {
			try {
				await unlink(pendingCachePath);
			} catch {
				// 写入前就失败或替换已完成时没有临时文件，无需额外处理。
			}
			console.warn(
				"[github-projects] Public repository cache could not be saved.",
			);
		}
		return {
			projects: createProjects(repositories),
			source: "live",
			fetchedAt,
		};
	} catch {
		console.warn(
			`[github-projects] GitHub unavailable; using ${cache ? "public cache" : "empty state"}.`,
		);
		return {
			projects: createProjects(cache?.repositories ?? []),
			source: cache ? "cache" : "empty",
			fetchedAt: cache?.fetchedAt ?? null,
		};
	}
}

/** 一次构建内共享同一个请求，列表、详情与首页不会各自再拉取。 */
export function getGithubProjects(): Promise<ProjectsSnapshot> {
	snapshotPromise ??= loadSnapshot();
	return snapshotPromise;
}

export function getFeaturedProjects(projects: Project[]): Project[] {
	return projects
		.filter((project) => project.featured)
		.slice(0, maximumFeatured);
}

/** API 降级且旧缓存缺少精选仓库时，保留配置入口，不把它伪装成已同步项目。 */
export function getPendingFeaturedProjects(
	snapshot: ProjectsSnapshot,
): PendingFeaturedProject[] {
	if (snapshot.source === "live") return [];
	return projectsConfig.featured
		.filter(
			(name) =>
				/^[A-Za-z0-9_.-]+$/.test(name) &&
				!containsName(projectsConfig.hidden, name) &&
				!snapshot.projects.some(
					(project) => project.name.toLowerCase() === name.toLowerCase(),
				),
		)
		.flatMap((name): PendingFeaturedProject[] => {
			const override = Object.entries(projectsConfig.overrides).find(
				([key]) => key.toLowerCase() === name.toLowerCase(),
			)?.[1];
			return override?.hidden
				? []
				: [
						{
							title: plainText(override?.title) || name,
							description: plainText(override?.description),
							githubUrl: `https://github.com/${githubOwner}/${name}`,
						},
					];
		})
		.slice(0, maximumFeatured - getFeaturedProjects(snapshot.projects).length);
}

export function getProjectStatusKey(status: ProjectStatus): I18nKey {
	const keys: Record<ProjectStatus, I18nKey> = {
		planning: I18nKey.projectsPlanning,
		developing: I18nKey.projectsDeveloping,
		published: I18nKey.projectsPublished,
		archived: I18nKey.projectsArchived,
	};
	return keys[status];
}
