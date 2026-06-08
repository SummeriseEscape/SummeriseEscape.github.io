import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // 部署前请将 site URL 改为你自己的域名，sitemap 和 OG 图片等会使用此地址
  site: 'https://starrybreeze.github.io',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      // 代码块语法高亮主题，可用主题列表见 https://shiki.style/themes
      theme: 'github-light',
    },
  },
});
