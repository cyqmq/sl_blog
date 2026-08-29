# 导航 + 博客 Demo（Astro + Cloudflare Pages）

一个用 [Astro](https://astro.build) 构建、部署在 [Cloudflare Pages](https://pages.cloudflare.com) 的极简导航站 + 博客。

## 目录结构

```
src/
├── config/site.ts               # 全站配置：资料 / 社交 / 导航分类 / 主题色 / 评论
├── components/                  # Icon、NavigationSection、CommentSection 等
├── content/
│   ├── config.ts                 # 博客文章 schema
│   └── blog/*.md(x)             # 博客文章（新增 .md / .mdx 即发布）
├── layouts/BaseLayout.astro      # 公共布局/样式/主题切换
├── pages/
│   ├── index.astro               # 导航仪表盘首页
│   ├── blog/index.astro          # 博客列表（搜索/标签筛选）
│   ├── blog/[...slug].astro      # 文章详情（目录 + 评论）
│   ├── search.astro              # 全文搜索（Pagefind）
│   ├── about.astro               # 关于（资料 + 复制邮箱）
│   └── rss.xml.js                # RSS 订阅
└── styles/global.css             # 全局样式
```

## 已实现功能（参考 astro-navfolio）

- **仪表盘首页**：头像 + 简介 + 社交链接 + 分组导航卡片
- **多主题**：深/浅色 + 8 种主题色（持久化，零依赖）
- **博客**：Markdown / MDX、代码高亮（Shiki 双主题）、KaTeX 数学公式、文章目录（TOC）
- **全文搜索**：`/search` 基于 Pagefind（构建后生效）
- **评论**：Giscus 组件（在 `site.ts` 开启并配置后生效）
- **RSS** 订阅

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
```

> 全文搜索依赖构建产物，需 `npm run build && npm run preview` 后访问 `/search` 才能使用；`dev` 模式下搜索页会提示先构建。

## 部署到 Cloudflare Pages

**方式一：Git 集成（推荐，推送即部署）**

1. 把仓库推到 GitHub。
2. 登录 Cloudflare Dashboard → Workers & Pages → 创建 → Pages → 连接 Git 仓库。
3. 构建设置：
   - 构建命令：`npm run build`
   - 构建输出目录：`dist`
4. 保存并部署。之后每次 `git push` 自动部署。

**方式二：Wrangler 命令行**

```bash
npm install
npm run build
npx wrangler pages deploy ./dist
```

> 需先全局安装 `wrangler`：`npm i -g wrangler`。`wrangler.toml` 已声明 `pages_build_output_dir = "./dist"`。

记得修改 `astro.config.mjs` 里的 `site` 为你的正式域名（RSS 绝对链接要用）。

## 自定义

- **改资料/导航/主题色/评论**：编辑 `src/config/site.ts`
- **写文章**：在 `src/content/blog/` 新建 `.md` 或 `.mdx`，头部填写 `title / description / pubDate / tags`
- **改样式**：编辑 `src/styles/global.css`

## 管理员入口（自定义登录页 + Cookie）

站点本身**公开**（导航 / 博客 / 关于任何人可访问）；仅 **`/admin` 管理后台**需要登录。
通过 Cloudflare Pages Functions（`functions/_middleware.ts`）实现：未登录访问 `/admin` 跳转 `/login`，
输入管理员密码后下发 HttpOnly Cookie 方可进入；`/logout` 退出。

**环境变量（必需）**
- `SITE_PASSWORD`：管理员密码
- `AUTH_SECRET`：用于签发 Cookie 的 HMAC 密钥（请设为随机长字符串）

**本地预览（含登录）**
```bash
npm run build
npx wrangler pages dev ./dist --ip 0.0.0.0 --port 8788
# 公开站点：http://<你的IP>:8788/
# 管理后台：http://<你的IP>:8788/admin （默认密码见 .dev.vars：SITE_PASSWORD=opencode123）
```
> `astro dev`（4321）不执行 Pages Functions，因此不会触发登录；登录逻辑仅在生产 / `wrangler pages dev` 生效。本地的 `.dev.vars` 已被 gitignore，请勿提交真实密码。

**生产部署**
1. 在 Cloudflare Pages 控制台 → Settings → Environment variables 添加 `SITE_PASSWORD` 与 `AUTH_SECRET`。
2. 正常构建部署（`npm run build` 输出 `dist`，Pages 自动加载 `functions/`）。

## 说明

当前使用 `output: 'static'` 纯静态输出，对导航站和博客完全够用，也最简单。
如需 KV/SSR 等动态能力，可改用 `output: 'hybrid'` 或 `'server'` 并配合 Cloudflare 绑定。
