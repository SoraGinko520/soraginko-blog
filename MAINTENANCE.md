# SoraGinko 博客操作说明（详细版）

> 本文档用于日常维护、内容发布、友链审核、部署与上线检查。\
> 项目技术栈：Astro、Svelte、TypeScript、Pagefind。\
> 当前约定：Node.js 22 或兼容更新版本，pnpm 9.14.4。\
> 正式站点目标：<https://soraginko.moe>\
> 评论服务目标地址：<https://comment.soraginko.moe/>

---

## 1. 开始前先确认环境

在进行任何修改前，先确认当前终端位于项目根目录。

### 1.1 检查 Node.js

```sh
node -v
```

建议使用 Node.js 22 或兼容的更新版本。

### 1.2 检查 pnpm

```sh
pnpm -v
```

项目约定使用 pnpm 9.14.4。不要在同一个项目中混用 npm、Yarn 或 Bun 的锁文件。

### 1.3 首次安装依赖

```sh
pnpm install
```

安装完成后再启动开发服务器。

### 1.4 启动本地开发环境

```sh
pnpm dev
```

开发服务器启动后，在终端给出的本地地址中预览网站。

> 本地开发模式会显示草稿文章，生产构建会排除 `draft: true` 的文章。

---

## 2. 常用命令速查

| 用途 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 开发服务器 | `pnpm dev` |
| Astro 检查 | `pnpm check` |
| TypeScript 检查 | `pnpm type-check` |
| 只读代码规范检查 | `pnpm exec biome check ./src` |
| 生产构建与搜索索引 | `pnpm build` |
| 预览生产构建 | `pnpm preview` |
| 新建文章 | `pnpm new-post <filename>` |

### 2.1 推荐检查顺序

每次准备发布或提交较大修改时，建议按以下顺序执行：

```sh
pnpm check
pnpm type-check
pnpm exec biome check ./src
pnpm build
```

全部通过后，再使用：

```sh
pnpm preview
```

检查真实生产产物。

> `pnpm lint` 会自动修改代码；如果只是检查，不想让工具自动改文件，优先使用 `pnpm exec biome check ./src`。

---

## 3. 写第一篇文章

文章位于：

```text
src/content/posts/
```

### 3.1 创建文章

例如创建 `first-note.md`：

```sh
pnpm new-post first-note
```

生成后编辑：

```text
src/content/posts/first-note.md
```

### 3.2 建议先改为草稿

脚本默认生成：

```yaml
draft: false
```

如果文章还没写完，建议先改成：

```yaml
draft: true
```

这样本地可以预览，但生产构建不会发布。

### 3.3 Frontmatter 示例

```yaml
---
title: 我的第一篇学习记录
published: 2026-10-02
updated: 2026-10-02
description: 简短说明这篇记录解决了什么问题
image: ""
tags: [学习笔记, Astro]
category: 技术文档
draft: true
pinned: false
---
```

### 3.4 各字段怎么用

- `title`：文章标题。
- `published`：真实发布时间。
- `updated`：重要修改后的更新时间。
- `description`：文章摘要。
- `image`：文章封面。
- `tags`：标签数组。
- `category`：文章分类。
- `draft`：是否草稿。
- `pinned`：是否置顶。

### 3.5 技术文章建议结构

可以按以下顺序写：

```text
背景与目标
↓
环境与版本
↓
操作过程
↓
遇到的问题
↓
解决方法
↓
结论
↓
参考资料
```

代码块建议标注语言，例如：

````md
```ts
const hello = "SoraGinko";
```
````

引用外部内容时注明来源。

### 3.6 发布文章

文章完成后：

1. 把 `draft: true` 改成 `draft: false`。
2. 检查标题、日期、图片和链接。
3. 检查错别字。
4. 运行：

```sh
pnpm check
pnpm type-check
pnpm exec biome check ./src
pnpm build
```

5. 使用：

```sh
pnpm preview
```

6. 确认生产预览正常后再提交和部署。

---

## 4. 写生活杂谈

生活杂谈和技术文章仍放在同一个集合：

```text
src/content/posts/
```

不需要新建单独内容集合。

### 4.1 分类写法

```yaml
category: 生活杂谈
```

### 4.2 内容建议

可以按以下结构写：

```text
发生了什么
↓
我的感受
↓
想留下什么
```

### 4.3 当前需要注意

现有 `/life/` 提供分类入口，相册、书架、Bilibili 和短动态独立成页，不会自动按 `生活杂谈` 分类聚合长文。

生活杂谈目前仍然会进入：

- 文档列表；
- 归档；
- 图谱。

生活页短动态在 `lifeConfig.moments` 维护；长篇生活杂谈继续使用文章集合。

---

## Life / 生活模块维护

生活首页 `/life/` 只保留四个分类入口，不再把所有内容堆在同一页。相册沿用 `/gallery/`，番剧为 `/life/bilibili/`，书架为 `/life/books/`，短动态为 `/life/moments/`。各页共用分类导航，可以直接切换。短记录不是朋友圈；朋友圈 `/fcircle/` 展示好友博客文章，长篇生活杂谈仍放在 `src/content/posts/`。

数据入口只有两处：相册沿用 `src/config/galleryConfig.ts` 与 `public/gallery/`，书籍、Bilibili、短动态及四个快捷入口统一在 `src/config/lifeConfig.ts`。不要另建 Life 内容集合或复制第二套图库。

### 如何新增相册

1. 在 `public/gallery/<id>/` 放入图片，例如 `public/gallery/my-album/001.webp`。图片须有自己的使用权；发布前检查定位、人物隐私及 EXIF。扫描只读取该目录的直接子文件，不递归子目录。
2. 在 `galleryConfig.albums` 增加一个条目。以下是字段示例，不是已发布内容：

```ts
{
  id: "my-album",
  name: "相册标题",
  description: "相册介绍",
  date: "2026-10-03",
  location: "拍摄地点",
  tags: ["日常"],
  // cover: "/gallery/my-album/cover.webp",
}
```

真实字段是 `id`（同时作为 URL slug 与图片目录名）、`name`（标题）、可选 `description/date/location/tags/cover`，没有独立的 `title/slug/images` 字段。图片清单由目录自动生成，支持 jpg/jpeg/png/webp/avif/gif，按文件名排序，`cover.*` 优先。封面顺序：配置的 `cover` → 目录中的 `cover.*` → 第一张图片。

相册详情为 `/gallery/<id>/`，生活分类的相册入口直接使用全集 `/gallery/`，不再在生活首页复制整份相册列表。修改标题或说明改配置；修改照片替换对应文件并重新构建。删除相册先移除配置条目，再按需要删除明确的图片目录；不要批量删除 `public/`。改 `id` 时同时调整目录，旧 URL 将失效。

相册目录不存在时显示零张照片；损坏图片仍可能导致现有扫描失败，应在发布前检查图片是否可正常打开。当前代码没有照片上传后台。

### 如何新增一本书

在 `lifeConfig.books` 添加条目，`id/title/author/status` 必填，`cover/note` 可选：

```ts
{
  id: "my-book",
  title: "书名",
  author: "作者",
  cover: "/assets/images/book-cover.webp",
  status: "reading",
  note: "自己的阅读短记。",
}
```

封面路径对应你实际放入 `public/assets/images/` 的图片；不填封面使用图标，不自动搜索书封。状态固定为 `reading`（在读）、`finished`（已读）、`planned`（想读）。书架统计来自实际条目，可点击状态筛选；没有 JS 时仍展示全部书籍。修改原条目即可更新状态或笔记，删除该条目即可移除，图片是否保留另行决定。

### 如何配置 Bilibili

`lifeConfig.bilibili` 按 UID 在构建期读取 Bilibili 的公开追番、追剧列表，展示封面、名称、更新进度、评分（接口有提供时）和简介。参照 LengxiQwQ 的公开追番接口适配，不展示自己的个人主页卡片，不同步私人收藏或账号动态，不需要 Cookie 或登录 Token。

- `uid`：你的真实 UID，当前为 `546979349`。
- `enabled`：是否同步公开追番列表；关闭时保留停用状态。

在 Bilibili 开启追番/追剧列表公开，添加或取消追番后重新构建博客即可更新；不是每次打开页面重新抓取。页面支持名称搜索和番剧/剧集筛选，链接进入对应作品播放页。若接口风控、超时或隐私设置不允许读取，会显示“公开追番列表暂不可用”，不会伪装成真实的 0 部，也不会阻止全站构建。只有接口成功返回空列表时才显示暂无追番。当前没有私人接口代理或追番缓存；服务不可用时应稍后重新构建，不要把 Cookie 写入代码。

### 如何新增一条动态

在 `lifeConfig.moments` 中新增一项，`id/date/content` 必填，支持可选 `title/images/tags/draft`：

```ts
{
  id: "my-note",
  date: "2026-10-03T18:30:00+08:00",
  title: "一条短记录",
  content: "纯文本正文。\n第二行。",
  images: ["/assets/images/my-note.webp"],
  tags: ["日常"],
  draft: true,
}
```

示例默认是草稿，不要直接当作真实经历发布。正文是纯文本，可换行，不执行 HTML 或 Markdown。图片使用真实本地路径或公开图片 URL，不填 `images` 也可发布。修改原条目即可改正文、日期、图片或标签；删除条目即可移除动态。

动态按日期从最新到最旧排序；无效日期、`draft: true` 不展示，生产构建也排除尚未到发布时间的条目。建议使用带 `+08:00` 的时间；显示日期遵循站点时区。动态标签只装饰短记录，**不计入文章标签索引**。需要代码块或长文排版时改写为博客文章。

### 首页 Life 快捷入口

地图指南右下默认显示 Life 封面卡；点击（键盘 Enter / Space 也可）才展开四格与中央正方形，再点击右上角关闭控件恢复封面。不是悬停触发，也不是默认露出五宫格。桌面与移动端复用同一个原生 details 组件；导航栏的“生活”则是下拉分类菜单，两处共享 `lifeConfig.navigation`：

| 位置 | 内容 | 当前路径 |
| --- | --- | --- |
| 左上 | 相册 / Album | `/gallery/` |
| 右上 | 哔哩哔哩 / Bilibili | `/life/bilibili/` |
| 左下 | 动态 / Moments | `/life/moments/` |
| 右下 | 书架 / Bookshelf | `/life/books/` |
| 中央 | 标签 / Tags | `/archive/` |

外围四格的 `id/label/ariaLabel/eyebrow/url/icon/position` 统一在 `lifeConfig.navigation` 维护。中文标签与无障碍文案使用现有 i18n key，新增 key 必须补齐全部语言表。改变 URL 时同时确认对应页面文件存在，不再使用旧的 `/life/#...` 分区锚点。关闭 `siteConfig.pages.life` 会隐藏首页五宫格及生活分类页的站点地图条目。

中央标签通过现有 `getTagUrl("")` 复用完整归档标签入口，**不在 Life 配置复制标签数据**。当前项目没有独立的 `/tags/` 路由。原 GitHub、RSS、留言板等联系功能仍保留在原导航、个人社交链接及对应页面。

### 标签索引

首页同时存在两个层级：**标签索引卡**展示热门标签和文章数量；**五宫格中央 Tags**只提供进入完整标签系统的快捷链接。两者复用同一个归档标签系统，不是两套 Tags。

标签索引由 `getTagList()` 从真实 `posts` 集合的 frontmatter 计算，先剔除非字符串、修剪两端空格并排除空标签，每个有效标签出现一次便计数一次；每篇文章应避免重复标签。生产环境不计草稿，开发环境允许看到草稿。示例：

```yaml
---
title: 学习记录
published: 2026-10-03
draft: true
tags:
  - Astro
  - TypeScript
category: 学习文档
---
```

发布时将 `draft` 改为 `false`，重新构建后标签统计、热门标签、标签筛选及完整标签列表同步变化。首页最多显示 5 个热门标签，按文章数量降序，数量相同沿用当前稳定排序；另有“全部标签”胶囊。

单标签实际 URL 是 `/archive/?tag=Astro`（名称由 `getTagUrl` 自动编码），不是 `/tags/astro/`。全部标签及五宫格中央入口均为 `/archive/`，在现有归档页选择标签筛选。空文章集合不伪造 #AI、#Java 或数量，仍保留标题和完整入口。分类索引继续按文章 `category` 独立统计。

Life 修改后执行 `pnpm check`、`pnpm type-check`、`pnpm exec biome check ./src`、`pnpm build`、`pnpm preview`，再检查亮暗主题、手机入口与 Swup 往返。最终 README 截图须在全部页面正式验收通过后生成，不用参考站截图代替。


---

## 5. 修改首页、头像、签名和导航

常用配置位置如下。

| 内容 | 维护位置 |
| --- | --- |
| 关于我正文 | `src/content/spec/about.mdx` |
| 姓名、头像、签名、首页素材、预设台词 | `src/config/homeConfig.ts` |
| 站点标题、域名、主题、功能开关 | `src/config/siteConfig.ts` |
| 导航结构 | `src/config/navBarConfig.ts` |
| 音乐歌单与服务 | `src/config/musicConfig.ts` |
| 友链与本站信息 | `src/config/friendsConfig.ts` |
| 文章正文 | `src/content/posts/` |

### 5.1 修改关于我

编辑：

```text
src/content/spec/about.mdx
```

当前页面本身已经提供 H1，所以正文建议从 H2 开始。

### 5.2 修改首页头像、昵称、签名

编辑：

```text
src/config/homeConfig.ts
```

适合修改：

- 名称；
- 头像；
- 签名；
- 首页使用的图片；
- 首页预设互动台词。

### 5.3 修改站点标题、域名或开关

编辑：

```text
src/config/siteConfig.ts
```

不要只改页面上显示的文字而忽略站点配置。

### 5.4 修改导航

编辑：

```text
src/config/navBarConfig.ts
```

桌面导航和移动端菜单共享该配置，结构为：首页 / 网站导航 / 文章 / 项目 / 生活 / 社交 / 关于。社交包含友情链接、友链朋友圈、留言板；关于只包含关于我，以及启用时的音乐。所有入口跟随对应页面开关，关闭页面时应同步隐藏导航和 sitemap。

---

## 6. 图片与封面维护

### 6.1 文章封面

Frontmatter 中填写：

```yaml
image: "./assets/cover.webp"
```

相对图片可放在文章所在的现有目录中。

### 6.2 `public/` 图片

位于 `public/` 的图片会原样复制，不会自动优化。

因此上传前建议：

- 压缩图片；
- 控制实际分辨率；
- 不要上传远高于使用尺寸的超大原图。

### 6.3 替换图片时

建议使用新文件名或内容哈希，避免浏览器或 CDN 长期缓存旧图。

### 6.4 不要手改自动生成文件

以下内容不要直接手动编辑：

```text
src/constants/icons.ts
src/constants/lqips.json
```

---

## 7. 友链申请与审核：完整流程

当前项目已经有 GitHub Issue + GitHub Actions 的友链申请机制。

相关文件：

```text
.github/ISSUE_TEMPLATE/friend-link.yml
.github/workflows/friend-link-checker.yml
.github/scripts/process-friend-request.cjs
```

友链实际配置位于：

```text
src/config/friendsConfig.ts
```

### 7.1 对外公开的友链申请流程

申请者应该按以下顺序操作：

1. 先在自己的博客中添加 SoraGinko 的友链。
2. 打开仓库 Issues。
3. 新建 Issue。
4. 选择友链申请表单。
5. 填写网站名称、网站地址、头像、描述以及回链页面。
6. 提交 Issue。
7. 等待 GitHub Actions 自动检查。
8. 自动检查通过后，等待站长人工审核。

### 7.2 为什么必须先添加本站

友链检查会核对申请者公开页面中是否存在本站回链。

因此流程必须是：

```text
先添加本站
↓
再提交申请
↓
自动检查
↓
人工审核
↓
最终收录
```

不是先申请再补回链。

### 7.3 自动检查失败时怎么办

申请者先修复问题，例如：

- 网站地址错误；
- 回链页面错误；
- 尚未添加本站；
- 页面尚未部署；
- 页面暂时无法公开访问。

修复后：

1. 修改原 Issue 中的信息；
2. 不要重新创建新的 Issue；
3. 在原 Issue 中单独评论：

```text
/recheck-friend
```

普通回复不会触发重新检查。

当前自动重查最多累计四次。达到上限后需要由维护者人工处理。

### 7.4 站长如何审核

自动检查通过后，仍然不会自动收录。

维护者应先人工检查：

- 网站是否正常打开；
- 是否确实存在本站回链；
- 网站内容是否适合交换友链；
- 网站信息是否真实可用；
- 头像地址是否稳定；
- 是否有明显恶意、诈骗或违规内容。

确认通过后，在对应 Issue 中评论：

```text
/approve-friend
```

工作流会重新检查，然后才会写入默认分支。

### 7.5 批准失败怎么办

如果 `/approve-friend` 时重新检查失败：

1. 先不要直接手工加入配置；
2. 让申请者修正页面或 Issue；
3. 重新检查；
4. 维护者再次人工确认；
5. 再次评论：

```text
/approve-friend
```

申请者自己 `/recheck-friend` 成功，不代表自动恢复“已批准”状态。

### 7.6 工作流上线前必须检查

上传 GitHub 后确认：

- 仓库 Issues 已启用；
- GitHub Actions 已启用；
- 默认分支允许工作流更新；
- 分支保护没有阻止机器人写入；
- `GITHUB_TOKEN` 权限足够完成工作流需要的操作。

当前设计默认使用 `GITHUB_TOKEN`，不需要把个人 Token 写进代码。

### 7.7 本地是否需要 Playwright

不需要。

日常写文章和审核友链无需本地浏览器安装，友链检查在 CI 复用现有 Playwright。本轮 v3 另要求用已有浏览器能力核验生产预览、生成真实 README 截图；不得重复安装，也不得规避工具明确拒绝的访问限制。无法截图时保留待验收状态，不使用上游或 AI 假截图。

### 7.8 自动写入后为什么网站可能没立即变化

GitHub Actions 把友链配置写入仓库，不代表托管平台一定立即重新构建。

批准后需要检查：

1. 默认分支是否已经出现配置变更；
2. Vercel 是否收到新的构建事件；
3. 新部署是否成功；
4. 友链页面是否已经显示新站点。

如果 Vercel 没有自动部署，需要手动重新部署。

---

## 8. 友链朋友圈维护

### 8.1 单一名单与可选 Feed

`/friends/` 和 `/fcircle/` 共用 `src/config/friendsConfig.ts` 的 `friendsConfig`，不维护第二套名单。朋友圈只读取 `enabled === true` 的条目；原有 `title / imgurl / desc / siteurl / image / tags / weight / enabled` 以及页面配置、申请按钮和人工审核流程不变。

希望站点进入朋友圈时，可增加可选的 `feedUrl`：

```ts
{
  title: "Example",
  siteurl: "https://example.com/",
  imgurl: "https://example.com/avatar.webp",
  desc: "示例独立博客",
  image: "",
  tags: ["Blog"],
  weight: 5,
  enabled: true,
  feedUrl: "https://example.com/rss.xml",
}
```

这只是格式示例，不要把示例站点当成真实好友加入。没有 `feedUrl` 也不会影响普通友链；现有申请表单不要求 Feed，审核后可在配置里手动补充。

### 8.2 如何找 Feed

优先使用对方站点明确公布的 RSS / Atom 地址，例如订阅按钮或页面源码里的 `rel="alternate"`。未填写时，构建按顺序尝试 `/atom.xml`、`/rss.xml`、`/feed/`、`/feed.xml`；填写后只尝试指定地址，不擅自换来源。

当前支持 RSS 2.0、RSS 1.0 和 Atom。请求有超时，单站失败只在构建日志中警告，不会阻断其他好友或全站构建。文章按原文 URL 去重、发布时间倒序，最多保留 100 条，摘要清洗为纯文本，不渲染远程 HTML 正文。当前没有跨构建成功缓存，暂时离线的站点本次可能不显示文章。

### 8.3 本地验证与更新

```sh
pnpm dev
pnpm build
pnpm preview
```

访问 `/fcircle/`，检查站点、标题、发布时间、头像、原文链接，以及时间线 / 平铺切换。文章在构建时抓取，别人发布新文章后需要重新构建部署才会更新；页面在浏览器内只更新自然日标签与统计，不向全部好友发请求。

时间线默认按自然日分组，本周按周一至今计算；统计使用站点时区，当前为 Asia/Shanghai。用一个不可达 Feed 测试时，必须确认其他来源仍可用且 `pnpm build` 成功，测试后恢复真实地址。

### 8.4 常见问题

- **403 / 404**：检查公开地址、反爬策略和订阅路径；明确填写网站提供的 Feed，不以首页 HTML 代替 XML。
- **XML 无法解析**：确认返回的是 RSS / Atom，不是登录页、验证码或错误页。
- **没有发布时间**：缺少有效日期的条目不会伪造为今天，会被跳过。
- **重复文章**：相同规范化原文 URL 只保留一条；不同链接可能是不同文章。
- **临时离线**：等待对方恢复后重新构建，不影响友链卡片或其余站点。
- **友链正常但没有动态**：友链展示只需要站点信息；朋友圈还需要可读取的订阅源及有效文章日期。空名单 / 空 Feed 显示明确空状态，不自动加入参考作者的好友。

---

## 9. 关于页更新日志

数据文件是 `src/content/spec/log.md`，About 正文仍由 `src/content/spec/about.mdx` 维护。图谱位于正文后；卡片读取简述，关联线表示共同页面，点击卡片弹出 Markdown 详情。

每条使用二级标题，最新记录放最上面：

```md
## 新增社交与项目模块

- 日期：2026-10-02
- 类型：feat
- 页面：home / projects / friends / fcircle / guestbook / about / site
- 简述：重组社交导航，新增友链朋友圈与 GitHub 项目展示

1. 将友情链接和留言板移到“社交”。
2. 新增 RSS / Atom 朋友圈和 GitHub 项目展示。
3. 恢复更新日志图谱，统计未配置时显示明确状态。
```

示例不是未来完成承诺，写日志时只记录实际完成的修改。类型：`feat` 新功能、`fix` 修复、`style` 视觉调整、`refactor` 实现整理、`chore` 维护工作。

页面可填写一个或多个 key：`home / projects / friends / fcircle / guestbook / about / archive / list / categories / post / life / site`。实际 `CHANGELOG_DISPLAY_LIMIT` 为 **30**，图谱按文件顺序显示最上面的 30 条，不从 Git commit 自动推导内容。

以后使用 Codex / AI 对用户可见页面、功能、交互、导航、样式或部署行为进行实质修改时，应在最终检查和提交之前自动补充日志；纯格式化、无用户可见影响的小改动可以不写。此规则同时记录在 `AGENTS.md` 和 `CLAUDE.md`。日志不得把未验收的线上服务写成已经部署成功。

---

## 10. 站点访问统计 / 不蒜子与 Umami 免费模式

首页 UV / PV 和文章阅读量使用 **不蒜子公共计数（busuanzi.cc）**，不需要账号或私密 API Key。`src/utils/busuanzi-controller.ts` 适配公共脚本 3.6.9 的计数协议，并通过全站 Swup 页面孤岛统一发起请求；不要另外插入不蒜子脚本，否则会重复计数。每次首次打开和导航完成只请求一次，不轮询、不自动重试。修改 `siteConfig.site_url` 时，正式计数域名也会随构建更新。

只有与 `siteConfig.site_url` 主机名一致的 HTTPS 页面发送请求。本地、Vercel Preview 和其他域名显示“统计仅在正式域名启用，预览不计数”；超时、被拦截或数据异常时显示“访问统计暂不可用”，不填造 0。公共服务没有本站可承诺的 SLA 或数据完整性保证；更换来源不会自动继承 Umami 历史访问量。UV 使用服务自己的去重口径，不等于永久去重的独立真人。

**Umami Cloud 免费方案仍为 Tracking + Share URL**，仅供独立后台分析。不购买 Cloud API，不添加 `UMAMI_API_KEY`，不抓取分享页 HTML，也不通过客户端 Share API 取数。会话回放保持关闭。

在真实博客根目录 `E:\GitHub\sora-ginko-blog\.env` 或博客 Vercel 项目的 Environment Variables 中设置：

```dotenv
PUBLIC_UMAMI_WEBSITE_ID=
PUBLIC_UMAMI_SHARE_ID=
PUBLIC_UMAMI_SCRIPT_URL=
```

- `WEBSITE_ID`：自己网站追踪代码中的 `data-website-id`。
- `SCRIPT_URL`：追踪代码中脚本的完整 HTTPS URL。它与 Website ID 用于插入 Tracking Script，收集访问与出站事件。
- `SHARE_ID`：公开分享链接中的 ID，不是完整 URL。本站仅用于拼接 `https://cloud.umami.is/share/${PUBLIC_UMAMI_SHARE_ID}`，不会将它当作 JSON API。

首页桌面访问卡、展开详情与移动端统计同步显示不蒜子响应中的 UV / PV，来源明确为“不蒜子”。文章详情使用本页 PV；没有已发布文章时，不能把文章页真实计数说成已验收。设置 Umami Share ID 后提供“查看 Umami 分析 ↗”，使用新标签页及 `noopener noreferrer`；这不是不蒜子数字的明细后台。

`.env` 不提交；`.env.example` 只保留空变量和说明。不要把密码、API Key 或 GitHub Token 放入任何 `PUBLIC_` 变量。公开统计是否展示哪些视图，由自己的 Umami Share 设置决定。

修改本地配置后重启 `pnpm dev`；生产预览必须重新 `pnpm build`。Vercel 分别设置需要的 Production / Preview 环境后重新部署，旧部署不会自动换配置。真实值不贴入聊天或 README。

验收：

1. 开发者工具 Network 中 Tracking Script 能加载；若被广告屏蔽插件拦截，先排除插件影响。
2. 实际访问后，自己的 Umami 后台收到记录；配置存在或脚本标签存在不等于后台已收到数据。
3. 首页公开统计链接能打开自己的 Share 页面。
4. Network 不应出现 `cloud.umami.is/api/share/` 或博客主动发起的 Cloud Stats / Metrics 请求。
5. 在正式域名检查不蒜子计数 POST 每次导航只有一次，首页数字及移动端弹层一致，文章显示本页 PV；断网和超时有明确空态。预览域名不发计数请求。构建检查或模拟响应通过不代表公共服务线上统计已验收。

---

## 11. GitHub 项目模块维护

`/projects/`、`/projects/[slug]/` 与首页精选共用构建期数据：`SoraGinko520` 的公开 GitHub 仓库。浏览器不会每次加载页面重新请求 GitHub。

编辑 `src/config/projectsConfig.ts`：

```ts
export const projectsConfig = {
  featured: ["真实仓库名"],
  hidden: [],
  includeForks: [],
  overrides: {
    "真实仓库名": {
      title: "中文名称",
      description: "自己的中文简介",
      cover: "/assets/images/已有封面.webp",
      tags: ["Astro"],
      status: "developing",
      order: 10,
      // demo: "https://真实演示地址/",
      // hidden: true,
    },
  },
};
```

将示例名替换成自己真实存在的公开仓库名；没有仓库时不会靠配置生成假卡片。默认排除 fork，`includeForks` 按仓库名逐个放行。状态支持 `planning / developing / published / archived`：GitHub 已归档始终归档，其他默认已发布，不按“多久没提交”猜状态。`order` 数值越大越靠前；同值按 GitHub 更新时间降序排列，兼容旧版 `sort`，同时设置时优先使用 `order`。

精选取 `featured` 或 override 的 `featured: true`，最多 4 项；没有有效精选时首页整个模块隐藏。新公开仓库通常只需重新构建同步，不必手写页面；配置用于精选、隐藏、排序和文案增强，不是第二套项目名单。

GitHub API 成功后更新本地公开元数据缓存 `src/constants/github-projects.json`；失败时使用上一次成功缓存，没有缓存则显示友好空态，博客仍可构建。缓存不含 Token，不纳入公开提交；Vercel 新构建是否保留本地缓存取决于平台，不承诺跨部署持久化。

公开 API 无 Token 也会尝试。如果频繁限流，在本地 `.env` / Vercel 构建环境中加入 `GITHUB_TOKEN`，只授予公开仓库只读访问，**不要**命名为 `PUBLIC_GITHUB_TOKEN`，不要提交真实值。这个变量与 GitHub Actions 自动签发的工作流 `GITHUB_TOKEN` 不同，不需要给项目同步 Token 写库权限。

可选的本地项目详情使用现有 `spec` 集合，在 `src/content/spec/project-仓库slug.md` 中写正文；文件名中的 slug 对应项目详情 URL，正文从 H2 开始。不添加文件也能显示 GitHub 元数据；不会自动抓取远程 README，也不会因为增加说明文件就生成不存在的 GitHub 项目。

---

## 12. 日历与“建站日”

导航头像资料卡里的“建站日”由：

```text
src/config/calendarConfig.ts
```

中的：

```text
siteAnniversary
```

控制。

当前约定为每年 10 月 2 日。

这是每年重复的纪念日，不是页脚秒级计时的起点。

---

## 13. 页脚“本站已运行”时间

页脚运行时间使用另一个配置：

```text
src/config/siteConfig.ts
```

中的：

```text
siteStartDate
```

### 13.1 当前规则

运行时间从 **2026-10-02 首次提交仓库的真实具体时刻**开始。

当前起站时刻已按首次开始提交测试版的真实时间设置为 `2026-10-02T22:06:18+08:00`，与该提交的 Git 日期一致；不使用假的零点时间。

### 13.2 正确格式

首次提交使用真实时间，当前配置为：

```text
2026-10-02T22:06:18+08:00
```

以后修改站点配置时保留这个起站时刻，不随重新构建或后续提交重置。

### 13.3 最后更新时间

“最后更新于”默认使用本次生产构建的时间，不使用访客打开页面的时间。

它表示：

```text
这一份站点产物什么时候生成
```

它不等于：

- 某一篇文章的更新时间；
- 网站真正完成部署的时间。

重新构建会更新这个时间。

---

## Footer / 页脚维护

页脚配置在 `src/config/footerConfig.ts`，展示组件是 `src/components/layout/Footer.astro`，样式在 `src/styles/components/footer.css`。不要另建第二个页脚或重复计时器。

- **版权与站名**：版权年份取构建年份，名称取 `homeConfig.name`。当前为 © 2026 SoraGinko；个人签名与联系链接继续保留。
- **框架与主题**：`poweredBy` 维护显示名称和链接。当前框架为 Astro，直接源码基础为 Firefly-Mod（MmzMing/my-blog），不要改成无关主题名。
- **萌 ICP**：`moeIcp.enabled/text/url` 控制独立第二行，当前是“萌ICP备20260283号”，链接 `https://icp.gov.moe/?keyword=20260283`，新标签打开并带 `noopener noreferrer`。这不是工信部正式备案，不能移入 `beian.icp`。
- **正式备案**：`beian.icp/police` 当前为空，仅在拥有真实正式备案后填写；不编造备案号。
- **运行时间**：使用 `siteConfig.siteStartDate` 的真实起站时刻（见第 13 节），已有常驻页脚逻辑每秒更新，不因 Swup 导航或重新构建归零；无效/未来日期显示待设置。
- **最后更新时间**：使用构建产物内保存的构建时间。它不是文章更新时间或 Vercel 成功上线时间，重新构建才改变基准；跨日后显示真实过去天数。
- **布局与测试**：桌面底部左侧版权/框架/主题及萌 ICP，右侧运行时间/最后更新时间；移动端自动堆叠。修改后检查深浅主题、长文案和导航往返，确认没有横向溢出、重复计时器或错误外链。

---

## 14. 音乐页面和播放器

音乐配置位于：

```text
src/config/musicConfig.ts
```

当前项目复用上游 Meting 歌单配置。

需要注意：

- 音频不会被复制进仓库；
- 不自动播放；
- 实际可播放情况依赖第三方服务和版权限制；
- 如果后续更换歌单或服务，应优先修改配置，而不是直接硬改组件。

---

## 15. Waline 评论部署

博客前端目标地址为：

```text
https://comment.soraginko.moe/
```

配置了地址不代表评论后台已经真正可用。

### 15.1 当前涉及文件

```text
deployment/waline.env.example
deployment/waline.pgsql
```

### 15.2 数据库初始化

`deployment/waline.pgsql` 应在新建的空数据库中执行一次。

### 15.3 敏感信息

以下内容不要提交到仓库：

- 数据库连接串；
- 数据库密码；
- 私密 Token；
- 服务端密钥；
- `.env` 中的敏感值。

这些内容只放在服务端环境变量中。

博客项目本身不需要填写 Waline 的数据库环境变量。

### 15.4 推荐部署顺序

```text
部署 Neon PostgreSQL
↓
部署 Waline
↓
执行数据库初始化
↓
注册首位管理员
↓
验证匿名评论
↓
验证先审后发
↓
再部署博客正式站点
```

---

## 16. Vercel 部署

### 16.1 项目参数

| 参数 | 值 |
| --- | --- |
| 框架预设 | Astro |
| 根目录 | `./` |
| 安装命令 | `pnpm install` |
| 构建命令 | `pnpm build` |
| 输出目录 | `dist` |
| 正式域名 | `soraginko.moe` |
| 辅助域名 | `www.soraginko.moe` |

辅助域名应通过项目配置永久跳转到根域名。

### 16.2 第一次部署建议顺序

1. 先在本地执行全部检查。
2. 把代码提交到 GitHub。
3. 在 Vercel 导入仓库。
4. 使用 Vercel 临时域名完成首轮测试。
5. 检查：首页、文章、搜索、音乐、项目列表及至少一个真实详情、友情链接、朋友圈、About 更新日志、留言板、移动端。
6. 评论服务准备完成后再检查 Waline。
7. 确认无明显错误后绑定正式域名。
8. DNS 记录以 Vercel Domains 页面实时提示为准。

### 16.3 不要提前假定 DNS 值

Vercel 可能根据项目给出不同记录。

因此不要把某个固定 A 记录或 CNAME 当成永久规则。

每次以 Vercel Domains 页面实时配置为准。

---

### 16.4 IndexNow：部署后再真实提交

密钥只由本地 `INDEXNOW_KEY` 读取，验证文件为 `public/{key}.txt`，文件名与内容均须与环境变量匹配；不要改动已有真实 Key，不把它写进文档。

正式部署前仅运行：

```sh
pnpm indexnow --url https://soraginko.moe/ --dry-run
pnpm indexnow --diff --dry-run
pnpm indexnow --all --dry-run
```

`--diff` 需要当前目录是 Git 仓库且有 HEAD；`--all` 针对已发布文章，文章为空时返回空清单是正常行为；`--url` 可指定首页、项目或归档等实际 URL。Dry-run 只列出将提交的地址，不向 IndexNow 发请求。

确认 Vercel 构建成功且正式站更新后，站长才可手动运行：

```sh
pnpm indexnow --url https://soraginko.moe/
pnpm indexnow --all
```

不要以本地 Build 成功代替线上部署验收；Codex 本轮不执行真实 IndexNow 推送。

## 17. 正式发布前检查

发布前至少执行：

```sh
pnpm check
pnpm type-check
pnpm exec biome check ./src
pnpm build
pnpm preview
```

然后手动检查：

- 首页桌面布局；
- 首页手机布局；
- 导航跳转；
- 搜索；
- 文章页面；
- 归档；
- 图谱；
- 音乐页；
- 友链页；
- 留言板；
- Waline 评论；
- RSS；
- 图片加载；
- 控制台是否有错误。

---

## 18. 上传 GitHub 前必须排除的内容

不要直接把整个目录全部上传。

尤其不要无脑执行：

```sh
git add .
```

在首次公开仓库前，先检查是否包含以下内容：

- `.env`；
- 数据库密码；
- 数据库连接串；
- API Token；
- 服务端密钥；
- `node_modules/`；
- `dist/`；
- 临时截图；
- 缓存文件；
- 未确认可再分发的图片；
- 未确认可再分发的模型文件。

### 18.1 Live2D / Spine

当前：

```text
public/pio/models/
```

下的模型本地可以保留，但未确认再分发授权的模型不要随公开源码上传。

当前模型功能保持关闭。

“关闭功能”和“仓库私有”都不能替代授权本身。

---

## 19. 第三方素材使用原则

源码许可证不自动覆盖：

- 图片；
- 字体；
- 音乐；
- Spine；
- Live2D；
- 其他第三方视觉素材。

使用前应单独核对授权。

基本原则：

1. 需要作者同意时，先取得同意。
2. 需要署名时，标明作者和来源。
3. 不要因为“个人博客”或“非商业”就默认拥有素材授权。
4. 未确认再分发权的素材，不要跟源码一起公开分发。

---

## 20. 日常维护推荐流程

### 20.1 只改文章

```text
写文章
↓
本地 pnpm dev 预览
↓
改 draft 为 false
↓
pnpm check
↓
pnpm type-check
↓
pnpm exec biome check ./src
↓
pnpm build
↓
pnpm preview
↓
提交
↓
Vercel 部署
```

### 20.2 改配置或页面

```text
修改配置 / 页面
↓
pnpm dev
↓
桌面端检查
↓
移动端检查
↓
pnpm check
↓
pnpm type-check
↓
pnpm exec biome check ./src
↓
pnpm build
↓
pnpm preview
↓
提交并部署
```

### 20.3 审核友链

```text
收到友链 Issue
↓
等待自动检查
↓
人工查看网站
↓
符合要求
↓
评论 /approve-friend
↓
确认配置写入
↓
确认 Vercel 重新部署
↓
检查线上友链页面
```

---

## 21. 常见问题

### 21.1 为什么本地能看到草稿，部署后没有？

因为生产构建会排除 `draft: true` 的文章。

### 21.2 为什么友链批准了但线上没出现？

检查三个地方：

1. GitHub 默认分支是否已经出现配置变更；
2. Vercel 是否触发新部署；
3. 最新部署是否成功。

### 21.3 为什么修改图片后还是旧图？

可能是缓存。建议使用新文件名或内容哈希后重新构建部署。

### 21.4 为什么配置了 Waline 地址但评论不能用？

配置前端地址不代表 Waline 后端已经部署、数据库已经初始化或管理员流程已经验证。

### 21.5 为什么生活杂谈没有出现在生活页？

Life 的动态来自 `lifeConfig.moments`，相册来自 Gallery，书架来自本地配置，Bilibili 按真实 UID 构建期同步公开追番；长篇 `生活杂谈` 仍在文章列表、归档和图谱展示，不自动变成生活短动态。

### 21.6 为什么站点运行时间还没开始？

`siteStartDate` 已使用首次开始提交测试版的真实时刻。若页面仍显示待设置，应重新构建并确认部署使用最新代码；本地配置变化不会自动更新旧部署。

---

## 22. 最后检查清单

### 内容

- [ ] 文章标题正确
- [ ] 日期正确
- [ ] 草稿状态正确
- [ ] 图片可访问
- [ ] 外链可访问
- [ ] 没有公开私人敏感信息

### 代码

- [ ] `pnpm check` 通过
- [ ] `pnpm type-check` 通过
- [ ] `pnpm exec biome check ./src` 通过
- [ ] `pnpm build` 通过
- [ ] `pnpm preview` 正常

### 页面

- [ ] 首页桌面版正常
- [ ] 首页手机版正常
- [ ] 导航正常
- [ ] 搜索正常
- [ ] 文章正常
- [ ] 归档正常
- [ ] 图谱正常
- [ ] 音乐正常
- [ ] 友链正常
- [ ] 朋友圈时间线 / 平铺与坏 Feed 降级正常
- [ ] 项目搜索 / 状态筛选 / 真实详情正常
- [ ] About 更新日志卡片 / 关联线 / 弹层正常
- [ ] 不蒜子首页及文章计数、Swup 一次请求、预览跳过及失败空态已验收；Umami Tracking 与独立 Share 链接正常，无非公开 API 请求
- [ ] 留言板正常

### 部署

- [ ] Vercel 构建成功
- [ ] 临时域名测试通过
- [ ] 正式域名正常
- [ ] `www` 跳转正常
- [ ] Waline 服务正常
- [ ] 数据库密钥没有进入仓库

### 版权和素材

- [ ] LICENSE 保留
- [ ] README 中的来源说明保留
- [ ] 未确认再分发的模型未上传
- [ ] 未确认再分发的第三方素材未误打包

---

## 23. 核心文件速查

```text
src/config/homeConfig.ts
    首页姓名、头像、签名、素材、预设台词

src/config/siteConfig.ts
    站点标题、域名、主题、功能开关、siteStartDate

src/config/navBarConfig.ts
    导航结构

src/config/musicConfig.ts
    音乐歌单与服务

src/config/friendsConfig.ts
    友链、本站信息与可选 feedUrl（朋友圈共用名单）

src/config/projectsConfig.ts
    GitHub 项目精选、隐藏、文案、封面与状态覆盖

src/utils/github-projects.ts
    构建期公开仓库同步与本地成功缓存

src/content/spec/log.md
    About 更新日志，最新放最上方

src/content/spec/project-仓库slug.md
    可选项目说明，复用现有 spec 集合

.env.example
    公开统计配置与可选构建 Token 的空变量说明

src/config/calendarConfig.ts
    siteAnniversary 等日历配置

src/content/posts/
    博客文章

src/content/spec/about.mdx
    关于我正文

.github/ISSUE_TEMPLATE/friend-link.yml
    友链申请表单

.github/workflows/friend-link-checker.yml
    友链自动检查工作流

.github/scripts/process-friend-request.cjs
    友链校验与配置更新脚本

deployment/waline.env.example
    Waline 非敏感环境变量示例

deployment/waline.pgsql
    Waline 数据库初始化脚本
```

---

## 24. 维护原则

日常维护时尽量遵守以下原则：

- 先本地验证，再部署；
- 先草稿，再发布；
- 先自动检查，再人工审核友链；
- 先核对授权，再公开素材；
- 密钥只放服务端环境变量，不进仓库；
- 配置项优先改配置文件，不要在组件里重复硬编码；
- GitHub 上代码更新成功，不等于 Vercel 已经部署成功；
- 域名已配置，不等于线上功能全部已经验收。
