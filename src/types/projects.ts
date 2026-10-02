export const projectStatuses = [
	"planning",
	"developing",
	"published",
	"archived",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

/** 缓存仅保存公开仓库展示所需字段，不保存 API 响应或鉴权信息。 */
export interface GithubRepository {
	name: string;
	full_name: string;
	html_url: string;
	homepage: string | null;
	description: string | null;
	language: string | null;
	topics: string[];
	stargazers_count: number;
	forks_count: number;
	created_at: string;
	updated_at: string;
	archived: boolean;
	fork: boolean;
	visibility: "public";
}

export interface ProjectOverride {
	title?: string;
	description?: string;
	/** src 下路径（相对 src）或已有 public 图片路径。 */
	cover?: string;
	tags?: string[];
	status?: ProjectStatus;
	featured?: boolean;
	/** 数值越大越靠前；优先于旧版 sort。 */
	order?: number;
	/** 兼容旧配置，新增配置请使用 order。 */
	sort?: number;
	demo?: string;
	hidden?: boolean;
}

export interface ProjectsConfig {
	/** 仓库名，不是 GitHub URL；最多展示前四个有效精选项目。 */
	featured: string[];
	hidden: string[];
	/** 默认不展示 fork；这里可按仓库名逐个放行。 */
	includeForks: string[];
	overrides: Record<string, ProjectOverride>;
}

export interface GithubProjectsCache {
	owner: "SoraGinko520";
	fetchedAt: string | null;
	repositories: GithubRepository[];
}

export interface Project {
	slug: string;
	name: string;
	fullName: string;
	title: string;
	description: string;
	githubUrl: string;
	demoUrl: string;
	cover: string;
	language: string;
	tags: string[];
	status: ProjectStatus;
	stars: number;
	forks: number;
	createdAt: string;
	updatedAt: string;
	featured: boolean;
	sort: number;
}

export interface ProjectsSnapshot {
	projects: Project[];
	source: "live" | "cache" | "empty";
	fetchedAt: string | null;
}

export interface ProjectCardProps {
	project: Project;
	headingLevel?: "h2" | "h3";
}
