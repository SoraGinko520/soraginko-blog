# SoraGinko 的个人博客

本仓库用于构建和维护 **SoraGinko 的个人博客**，正式站点地址为 [https://soraginko.moe](https://soraginko.moe)。该地址是部署目标，不表示网站已经正式上线。

## 个人及非商业用途声明

**本项目仅用于个人学习、技术记录与生活分享，不用于商业运营、产品销售、付费服务或其他商业盈利活动。它是个人博客，不是商业产品。**

本项目基于已有开源项目进行个人化修改，不将上游代码、设计、素材或功能宣称为本人原创；不代表下列项目及其作者的官方作品，也不暗示原作者为本站背书。

上述非商业用途声明描述的是 SoraGinko 对本博客的使用方式，不修改、替代或收紧上游开源许可证赋予的权利。源码与第三方素材分别遵循各自的许可证或授权条件；非商业使用不等于自动取得素材使用或再分发授权。

## 项目来源与致谢

感谢以下四个项目及其作者、贡献者。直接使用的源码基础与学习、设计参考在此分别说明：

| 项目 | 与本博客的关系 |
| --- | --- |
| [MmzMing/my-blog](https://github.com/MmzMing/my-blog) | 当前博客的直接源码基础，即 Firefly-Mod。在其独立副本上整理了站点身份、内容、导航、功能开关和评论配置；现有页面结构、交互与工程机制来自该基础及其上游。 |
| [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly) | my-blog 的上游主题基础，也是博客架构、配置机制和内容组织的学习参考。 |
| [kihana2077/KihanaPage](https://github.com/kihana2077/KihanaPage) | 学习与设计参考，主要涉及标签组织和学习日志展示。当前版本未移植其 MkDocs 工程或新增其风格的独立标签页，不将参考构想描述为已实现功能。 |
| [tianshihao2003/dumplingandcakeblog](https://github.com/tianshihao2003/dumplingandcakeblog) | 学习与设计参考，主要涉及生活栏目与内容组织。当前版本未合并其相册、足迹、账单等生活功能，生活页仅为文字占位。 |

同时感谢更上游的 [saicaca/fuwari](https://github.com/saicaca/fuwari)，Firefly 基于该项目发展而来。上游 README 还列有 [hexo-theme-shoka](https://github.com/amehime/hexo-theme-shoka)、[astro-koharu](https://github.com/cosZone/astro-koharu) 和 [Mizuki](https://github.com/matsuzaka-yuki/Mizuki) 等灵感项目；这里保留其致谢，不表示本站直接移植了这些项目的源码。

## 当前版本状态

- 顶部导航为：首页 / 网站导航 / 文章 / 生活 / 关于；右侧保留搜索。
- 网站导航数据沿用直接源码基础中的现有条目。
- 文章提供文档列表、归档和图谱入口；原作者文章已从本项目移除，当前文章集合为空。
- 保留关于我、留言板、搜索、RSS 和静态机器可读内容入口。
- 生活页只显示“生活内容正在整理中。”，尚未实现相册或时间线。
- 友链、赞助、音乐和相册页面关闭，访问量统计关闭。
- Waline 前端目标为 `https://comment.soraginko.moe/`。评论后台尚未部署和完成验收，配置了地址不代表评论服务已经可用。
- 本轮未调整头像、背景、Logo、配色或页面样式；Spine 与 Live2D 模型功能均保持关闭。

## 本地使用

项目使用 Astro、Svelte、TypeScript 和 Pagefind。请使用 Node.js 22 或兼容的更新版本，以及项目 `packageManager` 指定的 pnpm 9.14.4；不要混用 npm、Yarn 或 Bun 的锁文件。

```sh
pnpm install
pnpm dev
```

| 用途 | 命令 |
| --- | --- |
| Astro 检查 | `pnpm check` |
| TypeScript 检查 | `pnpm type-check` |
| 生产构建与搜索索引 | `pnpm build` |
| 预览构建产物 | `pnpm preview` |
| 新建文章 | `pnpm new-post <filename>` |

站点配置位于 `src/config/`，文章位于 `src/content/posts/`。新文章应遵循现有 frontmatter 格式；未发布草稿可设置 `draft: true`。

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

正式发布顺序为：独立部署 Waline 与 Neon PostgreSQL → 注册首位管理员 → 验证匿名评论和先审后发 → 部署博客并绑定域名。先使用临时域名验证构建，DNS 记录值以 Vercel Domains 页面给出的实时配置为准。

评论项目的非敏感配置示例位于 [deployment/waline.env.example](deployment/waline.env.example)，数据库初始化脚本位于 [deployment/waline.pgsql](deployment/waline.pgsql)。SQL 应在新建的空数据库中执行一次；数据库连接串、密码和其他密钥只存放在服务端环境变量中，不提交到仓库。博客项目不需要填写 Waline 的数据库环境变量。

## 第三方素材与模型说明

源码许可证不自动涵盖图片、字体、音乐、Spine 或 Live2D 模型。现有素材不宣称为 SoraGinko 原创；后续启用、替换或再分发时必须分别核对授权。

首次源码上传不包含 `public/pio/models/` 下尚未确认再分发授权的模型文件。本地文件保留，模型功能保持关闭，不以关闭功能或使用私有仓库代替授权。

直接源码基础的 README 对 Live2D 模型另有以下声明，在此保留其来源和限制说明：

- 模型作者为 B 站用户 [木果阿木果](https://space.bilibili.com/886695)，相关来源见 [原作者视频](https://www.bilibili.com/video/BV1Ts9eBkEXX)。
- 使用前必须征得作者同意，并标明作者信息和来源地址。
- 模型设计版权归属库洛。
- 模型可用于鸣潮相关视频和直播，需标注来源。
- 禁止商用盈利，禁止二次上传转载引流。

这些说明不是本站已经取得授权的声明，不能以“个人博客、非商业用途”为由忽略作者的授权要求。

## 许可证与版权归属

直接源码基础随附的 [MIT License](LICENSE) 保留原文，其中包括：

- Copyright (c) 2024 [saicaca](https://github.com/saicaca) — [fuwari](https://github.com/saicaca/fuwari)
- Copyright (c) 2025 [CuteLeaf](https://github.com/CuteLeaf) — [Firefly](https://github.com/CuteLeaf/Firefly)

修改和发布时继续保留上游要求的版权及许可信息。本仓库的非商业用途声明不构成对上游 MIT 许可的重新授权；第三方代码或素材若有独立许可，以对应许可和授权条件为准。
