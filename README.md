# SoraGinko 的个人博客

> 基于 Firefly / Firefly-Mod 持续个性化修改的个人博客项目。

正式站点地址：<https://soraginko.moe>
该地址是部署目标，不表示网站已经正式上线。

![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm 9.14.4](https://img.shields.io/badge/pnpm-9.14.4-blue)
![Astro](https://img.shields.io/badge/Astro-7.x-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Svelte](https://img.shields.io/badge/Svelte-5.x-%23FF3E00)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-%2306B6D4)
![Biome](https://img.shields.io/badge/Biome-2.x-%2360A5FA)
![Swup](https://img.shields.io/badge/Swup-4.x-%237467EF)
![Pagefind](https://img.shields.io/badge/Pagefind-1.x-%234B5563)

## 个人及非商业用途声明

**本项目仅用于个人学习、技术记录与生活分享，不用于商业运营、产品销售、付费服务或其他商业盈利活动。它是个人博客，不是商业产品。**

本项目基于已有开源项目进行个人化修改，不将上游代码、设计、素材或功能宣称为本人原创；不代表下列项目及其作者的官方作品，也不暗示原作者为本站背书。

上述非商业用途声明描述的是 SoraGinko 对本博客的使用方式，不修改、替代或收紧上游开源许可证赋予的权利。源码与第三方素材分别遵循各自的许可证或授权条件；**非商业使用不等于自动取得图片、模型、字体、音乐或其他素材的使用与再分发授权。**

## 项目来源与致谢

感谢以下项目及其作者、贡献者。直接使用的源码基础，与学习、设计参考在此分别说明：

| 项目 | 与本博客的关系 |
| --- | --- |
| [MmzMing/my-blog](https://github.com/MmzMing/my-blog) | 当前博客的直接源码基础，即 Firefly-Mod。在其独立副本上继续整理站点身份、内容、导航、功能开关、评论配置与视觉样式；现有页面结构、交互与工程机制来自该基础及其上游。 |
| [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly) | `my-blog` 的上游主题基础，也是博客架构、配置机制、内容组织和组件设计的重要学习参考。 |
| [kihana2077/KihanaPage](https://github.com/kihana2077/KihanaPage) | 学习与设计参考，主要涉及标签组织和学习日志展示。当前版本未移植其 MkDocs 工程，也不将参考构想描述为已实现功能。 |
| [tianshihao2003/dumplingandcakeblog](https://github.com/tianshihao2003/dumplingandcakeblog) | 学习与设计参考，主要涉及生活栏目与内容组织。当前版本未直接合并其相册、足迹、账单等生活功能。 |
| [LengxiQwQ/lengxiqwq-site](https://github.com/LengxiQwQ/lengxiqwq-site) | 学习与功能设计参考，主要参考其“社交”导航分组、友链朋友圈的 Feed 聚合与时间线 / 平铺交互，以及项目 / 作品模块的信息架构。本博客在现有 Firefly-Mod 基础上按 SoraGinko 的数据、视觉与工程结构重新适配实现；不代表该项目作者为本站背书，也不将参考项目的作者内容、项目数据或视觉素材宣称为本站原创。 |

同时感谢更上游的 [saicaca/fuwari](https://github.com/saicaca/fuwari)，Firefly 基于该项目发展而来。

上游 README 还列有以下灵感项目，这里继续保留致谢；不表示本站直接移植了这些项目的源码：

- [hexo-theme-shoka](https://github.com/amehime/hexo-theme-shoka)
- [astro-koharu](https://github.com/cosZone/astro-koharu)
- [Mizuki](https://github.com/matsuzaka-yuki/Mizuki)

## 页面与功能概况

当前项目继续保留并使用 Firefly-Mod 的工程能力，包括：

- Astro + Svelte + TypeScript 的静态站点架构。
- Pagefind 站内搜索。
- 构建期生成 LLM Wiki，为 AI、搜索引擎和阅读器提供稳定的 JSON / Markdown 机器入口。
- QQ 群聊风格留言板，复用 Waline 的登录、审核与评论数据。
- 日历页面，用于展示文章发布时间。
- 分类 / 标签关系图谱，使用 D3.js 力导向布局与 Canvas 绘制。
- 文章封面图构建期优化与 LQIP 占位，减少图片加载闪白。
- CI 中的 Astro 类型检查与 Biome 代码质量检查。

## 当前版本状态

- 当前按站长确认发布测试版：代码与构建检查已通过，真实浏览器验收和 README 页面截图后补。Git 推送不代表 Vercel 部署、正式域名计数或评论服务已完成验收。
- 桌面与移动端共用导航：首页 / 网站导航 / 文章 / 项目 / 生活 / 社交 / 关于；保留搜索入口。
- 社交下含友情链接 / 友链朋友圈 / 留言板；关于下含关于我，以及启用时的音乐。入口随 `siteConfig.pages` 开关隐藏。
- 网站导航数据沿用直接源码基础中的现有条目，并可在配置中继续维护。
- 文章提供列表、归档和图谱入口；原作者文章不作为本站内容继续发布，当前文章集合以仓库实际内容为准。
- About 保留关于我正文，正文后恢复 Markdown 更新日志图谱、关联线与详情弹层；日志数据来自 `src/content/spec/log.md`，最多显示最上方 30 条。
- 保留留言板、搜索、RSS 和静态机器可读内容入口。
- `/projects/` 在构建时读取 SoraGinko520 的公开 GitHub 仓库，支持搜索、状态筛选、详情及可选本地说明。首页精选由 `projectsConfig.ts` 控制，无有效精选时隐藏。
- `/fcircle/` 和友情链接共用 `friendsConfig`；构建时读取可选 `feedUrl` 或探测 RSS / Atom，提供时间线 / 平铺及自然日统计，坏站不阻断全站。
- 生活页目前只有标题与介绍，尚未实现按“生活杂谈”分类聚合文章；相册、足迹、账单等扩展生活功能尚未合并。
- 友链、赞助、音乐和相册页面是否启用，以 `src/config/` 中的实际页面开关为准。
- 首页 UV / PV 和文章阅读量接入不蒜子公共计数（busuanzi.cc），仅正式 HTTPS 域名发送请求；预览不计数，失败显示明确空态。Umami Cloud 仍使用 Tracking + Share URL 作为独立后台分析，不读取 Cloud API、不抓取分享页、不混用两边数字。真实线上计数与 Tracking 接收情况需部署后单独验收。
- GitHub Token 可选，只用于构建；API 失败使用最近一次本地成功缓存，没有缓存则显示真实空态，不添加虚构项目。
- Waline 前端目标地址为 `https://comment.soraginko.moe/`。评论后台尚未部署和完成验收时，配置了地址不代表评论服务已经可用。
- 当前首页视觉已经围绕 **SoraGinko / 空银子** 进行个性化调整，主视觉使用浅蓝、白、冰蓝的清透配色体系，并对 Hero、Logo、头像、互动角色和相关内容卡片进行统一设计。
- Spine 与 Live2D 模型功能当前保持关闭；未确认再分发授权的模型文件不纳入首次公开源码上传。

## 视觉设计与角色素材

当前首页视觉以 **SoraGinko / 空银子** 为主要角色意象，整体采用浅蓝、白色、冰蓝和低饱和深蓝灰作为主色。

站内主要视觉资产包括：

- 首页 Hero 主视觉。
- 顶部 `SORAGINKO` 胶囊式品牌 Logo。
- 个人资料头像。
- Q 版互动角色与不同表情状态。
- 站点数据 / 文章档案等模块中的角色装饰图。

这些角色视觉资产**不属于 MIT 源码许可覆盖范围**，也不因本站为个人非商业博客而自动获得再分发授权。

### しらび（Shirabii）相关插画来源

《りゅうおうのおしごと！》（《龙王的工作！》）系列的官方插画由 **しらび（Shirabii）** 绘制。出版社 GA 文库 / SB Creative 的书籍页面亦明确标注“イラスト：しらび”。

本站当前参考或使用到的相关插画来源说明如下：

| 编号 | 用途 / 特征 | 原作者与来源说明 |
| --- | --- | --- |
| Illustration 01 | 青蓝背景、空银子近景头像 | 原画：しらび（Shirabii）。X 原帖：<https://x.com/shirabii/status/2097701533886607406?s=20> |
| Illustration 02 | 白底 / 长发空银子人物图 | 原画：しらび（Shirabii）。X 原帖：<https://x.com/shirabii/status/1607941410510241796?s=20> |
| Illustration 03 | 蓝天白云 Hero 主视觉所参考的空银子构图 | **原始版本为轻小说黑白插画，原画：しらび（Shirabii）**；当前博客所见彩色版本为基于原作黑白插画的第三方上色版本，**目前未确认上色作者**。请勿将该彩色版本误标为 Shirabii 的原始彩稿。具体卷次 / 页码仍待进一步核验。 |

官方系列信息可参考：

- [GA 文庫《りゅうおうのおしごと！》](https://ga.sbcr.jp/product/9784797384840/)
- [SB Creative《りゅうおうのおしごと！》](https://www.sbcr.jp/product/4797384840/)
- [しらび（@shirabii）](https://x.com/shirabii)

### Logo、头像与 Q 版衍生素材

站内 Logo、头像、Q 版互动角色等视觉资产围绕空银子的角色特征进行个人化设计与整理，用于本站品牌与交互呈现。

这些素材：

- 不改变原角色、原作及官方插画的版权归属；
- 不视为取得《龙王的工作！》角色 IP 的商业使用授权；
- 不包含在本仓库 MIT 源码许可的再授权范围内；
- 若后续公开再分发具体图片文件，应单独核对其来源与授权条件。

## 页面预览

当前 SoraGinko 生产预览截图**尚未完成**。旧上游截图不再作为本站页面预览展示；现有图片文件保留，不冒充当前站点。

待完成构建和真实浏览器验收后，在现有 `docs/images/` 放入并展示：首页 Desktop、首页 Mobile、项目、友链朋友圈、友情链接、关于和留言板。截图必须来自当前 `pnpm preview` 的真实页面，不能以设计稿、参考站或 AI 图片替代。

## 维护与配置

日常写文章、生活杂谈、关于我、友链审核和部署的详细操作见 [维护文档](docs/MAINTENANCE.md)；根目录 [MAINTENANCE.md](MAINTENANCE.md) 同步保留。

本轮新增章节：友链朋友圈、About 更新日志、Umami 统计与 GitHub 项目维护。用户可见实质改动须在最终检查前自动补一条真实日志，规则见 `AGENTS.md / CLAUDE.md`。

## 本地使用

项目使用 Astro、Svelte、TypeScript、Tailwind CSS 和 Pagefind。请使用 Node.js 22 或兼容的更新版本，并使用项目 `packageManager` 指定的 pnpm 版本（当前约定为 `pnpm 9.14.4`）。不要混用 npm、Yarn 或 Bun 的锁文件。

```sh
pnpm install
pnpm dev
```

### 常用命令

| 用途 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 开发服务器 | `pnpm dev` |
| Astro 检查 | `pnpm check` |
| TypeScript 检查 | `pnpm type-check` |
| 生产构建与搜索索引 | `pnpm build` |
| 预览构建产物 | `pnpm preview` |
| 格式化代码 | `pnpm format` |
| Lint + 自动修复 | `pnpm lint` |
| 新建文章 | `pnpm new-post <filename>` |
| 重新生成图标 | `pnpm icons` |
| 重新生成 LQIP 占位数据 | `pnpm lqips` |
| 推送文章 URL（预览） | `pnpm indexnow --diff --dry-run` |

站点配置位于 `src/config/`，文章位于 `src/content/posts/`。新文章应遵循现有 frontmatter 格式；未发布草稿可设置 `draft: true`。

## 配置系统

所有配置集中在 `src/config/`，通过 `@/config`（barrel 文件 `index.ts`）统一导出。

| 配置文件 | 职责 |
| --- | --- |
| `siteConfig.ts` | 核心配置：语言、主题色、页面开关、文章列表布局、分页、分析、图片优化、字体 |
| `navBarConfig.ts` | 导航栏链接配置（根据页面开关动态生成） |
| `homeConfig.ts` | 首页与用户资料配置：头像、昵称、签名、社交链接、首页图片、技能图标、作品百叶窗 |
| `commentConfig.ts` | 评论系统配置（Waline / Twikoo / Giscus / Artalk / Disqus） |
| `musicConfig.ts` | 音乐播放器配置（Meting API / 本地音乐） |
| `pioConfig.ts` | Live2D / Spine 看板娘配置 |
| `fontConfig.ts` | 自定义字体配置 |
| `galleryConfig.ts` | 相册配置 |
| `friendsConfig.ts` | 友情链接与朋友圈的单一名单，可选 `feedUrl` 不影响普通友链 |
| `projectsConfig.ts` | GitHub 项目精选、隐藏、中文标题、封面、状态与排序覆盖 |
| `sponsorConfig.ts` | 赞助页配置 |
| `calendarConfig.ts` | 日历小组件配置 |
| `announcementConfig.ts` | 公告栏配置 |
| `licenseConfig.ts` | 文章许可证配置 |
| `footerConfig.ts` | 页脚配置 |
| `coverImageConfig.ts` | 封面图配置 |
| `expressiveCodeConfig.ts` | 代码块渲染配置 |
| `plantumlConfig.ts` | PlantUML 配置 |
| `collectionsApiConfig.ts` | 收藏 API 配置 |
| `llmsConfig.ts` | `/llms.txt` 与 LLM Wiki 的机器入口配置 |

## LLM Wiki（静态）

项目不在构建阶段运行 Embedding 或 Vectorize。`pnpm build` 会从公开文章集合生成机器入口：

- `dist/llms.txt`：站点级入口和精选文章。
- `dist/wiki/index.json`：文章目录、摘要、章节和每篇文章的资源地址。
- `dist/wiki/articles/{slug}.json`：单篇文章的元数据、章节和原始正文。
- `dist/wiki/articles/{slug}.md`：带规范元数据的纯 Markdown 文章。

草稿、密码文章以及设置了 `wikiExclude: true` 的历史文章不会进入 Wiki，但仍可正常生成站内文章页。文章更新后重新构建即可同步机器入口。

## 封面图与 LQIP

文章 frontmatter 的 `image` 字段按三种形态处理：

- 相对路径（`./assets/cover.webp`）：`src` 下的本地资源，构建期经 Astro 图片服务按 `siteConfig.ts` 中的 `imageOptimization` 配置转码，产出多格式 `srcset` 与宽高，且不做放大。
- `/` 开头：`public` 下的资源，Astro 不做优化，原样引用。
- `http(s)` / `data:`：远程图，原样引用；命中 `imageOptimization.noReferrerDomains` 时补 `referrerpolicy="no-referrer"`。

`pnpm build` 会先运行 LQIP 生成脚本 `scripts/generate-lqips.ts`：把 `src` 与 `public` 下的图片缩到 2×2 取角点颜色，压成 18 字符 hex 存入 `src/constants/lqips.json`，渲染时解码成 CSS 斜向渐变作为占位背景，不产生额外请求。

脚本为增量处理：已有条目直接复用，只处理新增图片并清理已删除图片的残留条目。新增或替换图片后重新构建即可，也可单独运行：

```sh
pnpm lqips
```

## 搜索、GEO 与 SEO

仓库中保留部分搜索引擎 / 站长平台验证文件，用于站点收录和机器入口验证。实际提交前请以各平台当前控制台要求为准。

当前包括：

- `public/baidu_verify_codeva-PmiKD9Nizp.html`：百度站长工具验证文件。
- `public/ByteDanceVerify.html`：头条站长工具验证文件，可用于相关搜索 / 豆包生态收录验证。
- `public/{key}.txt`：Bing / IndexNow 相关验证文件。

## CI/CD 工作流

| 工作流 | 触发条件 | 说明 |
| --- | --- | --- |
| `ci.yml` | push / PR 到 `master` | Astro 类型检查 + Biome Lint 代码质量检查 |
| `friend-link-checker.yml` | Issue 创建 / 指定审核评论 | 自动检查可达性与回链；维护者 `/approve-friend` 后重新校验并写入默认分支，保留申请人 `/recheck-friend`。不自动绕过人工审核。 |

建议根据个人使用习惯调整 GitHub 通知设置，避免 CI 频繁触发不必要的邮件通知。

## Vercel 部署参数与顺序

| 参数 | 值 |
| --- | --- |
| 框架预设 | Astro |
| 根目录 | 仓库根目录 `./` |
| 安装命令 | `pnpm install` |
| 构建命令 | `pnpm build` |
| 输出目录 | `dist` |
| 正式域名 | `soraginko.moe` |
| 辅助域名 | `www.soraginko.moe`，通过项目配置永久跳转到根域名 |

正式发布建议顺序：

1. 独立部署 Waline 与 Neon PostgreSQL。
2. 注册首位管理员。
3. 验证匿名评论和“先审后发”流程。
4. 使用 Vercel 临时域名验证博客构建。
5. 部署博客并绑定正式域名。
6. DNS 记录值以 Vercel Domains 页面给出的实时配置为准。

评论项目的非敏感配置示例位于 [`deployment/waline.env.example`](deployment/waline.env.example)，数据库初始化脚本位于 [`deployment/waline.pgsql`](deployment/waline.pgsql)。

SQL 应在新建的空数据库中执行一次；数据库连接串、密码和其他密钥只存放在服务端环境变量中，不提交到仓库。博客项目本身不需要填写 Waline 的数据库环境变量。

### 静态部署

构建产物 `dist/` 可直接部署到 Vercel、Cloudflare Pages、Netlify、Nginx 等静态托管平台；当前项目本身不依赖 Cloudflare Worker、Wrangler、Vectorize、Embedding 或 Durable Object 资源。

## 评论、留言与统计

| 功能 | 说明 |
| --- | --- |
| 评论服务 | 若启用评论，需自行部署对应后端；当前优先配置 Waline。 |
| 留言板 | 留言板使用 Waline `/guestbook/` 频道；启用前需在 `src/config/commentConfig.ts` 中完成配置。 |
| 统计服务 | 首页与文章使用不蒜子公共计数，无需私密 Key，正式域名取自 `siteConfig.site_url`；本地及其他预览域名不计数。可选 Umami 的三个 `PUBLIC_UMAMI_*` 变量仅供独立追踪与公开分析链接，数字不混用。 |
| 项目同步 | 无 Token 也尝试公开 GitHub API；可选 `GITHUB_TOKEN` 仅供服务端构建，不加 `PUBLIC_`、不进入网页或仓库。 |
| 图片上传（可选） | 留言板默认可将小体积图片以内嵌方式提交；如需更大图片上传，可在 `commentConfig.waline.imageUploadURL` 中配置兼容的自建上传接口。文章图片仍建议使用独立图床。 |

## 第三方素材与授权说明

源码许可证不自动涵盖图片、字体、音乐、Spine、Live2D 模型或其他第三方素材。

现有素材不宣称为 SoraGinko 原创；后续启用、替换、公开展示或再分发时，必须分别核对授权条件。

通用原则：

- 使用前优先确认作者允许的使用方式。
- 需要署名时，标明作者信息和来源地址。
- 不将“个人博客 / 非商业用途”视为自动获得授权。
- 未确认再分发授权的素材，不随源码仓库公开分发。
- 若权利人提出合理的署名、替换或移除要求，应及时处理。

## Live2D / Spine 说明

首次源码上传不包含 `public/pio/models/` 下尚未确认再分发授权的模型文件。本地文件可自行保留，但模型功能当前保持关闭；不能以“功能关闭”或“私有仓库”替代对授权条件的核验。

现有 README 记录的 Live2D 模型作者为 B 站用户 [木果阿木果](https://space.bilibili.com/886695)，原有说明包括：

- 使用前必须征得作者同意。
- 必须标明作者信息和来源地址。
- 模型设计版权归属原权利方。
- 仅在作者允许的用途范围内使用。
- 禁止商用盈利，禁止二次上传转载引流。

这些说明是授权条件记录，不代表本站已经取得全部模型的公开再分发授权。

## 许可证与版权归属

直接源码基础随附的 [MIT License](LICENSE) 保留原文，其中包括：

- Copyright (c) 2024 [saicaca](https://github.com/saicaca) — [fuwari](https://github.com/saicaca/fuwari)
- Copyright (c) 2025 [CuteLeaf](https://github.com/CuteLeaf) — [Firefly](https://github.com/CuteLeaf/Firefly)

修改和发布时继续保留上游要求的版权及许可信息。

本仓库的非商业用途声明**不构成对上游 MIT 许可的重新授权**；第三方代码或素材若有独立许可，以对应许可和授权条件为准。

## Acknowledgements

感谢所有上游项目作者、贡献者、文档维护者，以及为本博客视觉设计与内容组织提供灵感的创作者。

SoraGinko Blog 仅用于个人学习、技术记录与生活分享。
