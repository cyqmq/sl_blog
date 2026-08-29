import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 纯静态站点：直接部署到 Cloudflare Pages 即可，无需 adapter。
// 将 <YOUR_DOMAIN> 改为你的正式域名（RSS / Pagefind 绝对链接要用）。
export default defineConfig({
  site: 'https://nav-blog-demo.pages.dev',
  output: 'static',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    // 双主题代码高亮：随站点深/浅色切换（配合 html.dark 类）
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
  integrations: [mdx()],
});
