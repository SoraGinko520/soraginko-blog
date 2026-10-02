import type { ProjectsConfig } from "@/types/projects";

/**
 * 项目数据来自 SoraGinko520 的公开 GitHub 仓库，展示规则统一在此维护。
 * 不按最后更新日期推断开发状态；未覆盖时只使用 GitHub archived 标记。
 * featured 留空时首页不显示精选区；填写真实仓库名后，下次构建自动生效。
 * overrides.order 数值越大越靠前；兼容原有 sort，不重复维护仓库元数据。
 */
export const projectsConfig: ProjectsConfig = {
	featured: [],
	hidden: [],
	includeForks: [],
	overrides: {},
};
