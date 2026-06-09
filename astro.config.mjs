import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { writePostToFile, deletePostFile, dataToFrontmatter } from './src/lib/posts-helpers.mjs';
import { addTrack, removeTrack } from './src/lib/music-helpers.mjs';

const IMAGES_DIR = path.resolve('public/images/posts');
const AUDIO_DIR = path.resolve('public/audio');

function safeFilename(name) {
  return name.replace(/^.*[\\/]/, '').replace(/[<>:"|?*\x00-\x1f]/g, '').trim();
}

function sendJSON(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

function apiPlugin() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsed = new URL(req.url, 'http://localhost');
        const pathname = parsed.pathname;

        // --- /api/upload ---
        if (pathname === '/api/upload' && req.method === 'POST') {
          try {
            const type = parsed.searchParams.get('type');
            const rawName = parsed.searchParams.get('name');
            if (!type || !['image', 'audio'].includes(type)) {
              return sendJSON(res, 400, { error: 'type 必须是 "image" 或 "audio"' });
            }
            if (!rawName) {
              return sendJSON(res, 400, { error: '缺少文件名' });
            }
            const fname = safeFilename(decodeURIComponent(rawName));
            if (!fname) return sendJSON(res, 400, { error: '文件名无效' });

            const buffer = await new Promise((resolve) => {
              const chunks = [];
              req.on('data', (c) => chunks.push(c));
              req.on('end', () => resolve(Buffer.concat(chunks)));
            });
            if (buffer.length === 0) return sendJSON(res, 400, { error: '文件内容为空' });

            const dir = type === 'image' ? IMAGES_DIR : AUDIO_DIR;
            await writeFile(path.join(dir, fname), buffer);
            const publicPath = type === 'image' ? `/images/posts/${fname}` : `/audio/${fname}`;
            sendJSON(res, 200, { success: true, path: publicPath });
          } catch (e) {
            sendJSON(res, 500, { error: `处理失败: ${e.message}` });
          }
          return;
        }

        // --- /api/posts (POST/PUT/DELETE only; GET stays in Astro) ---
        if (pathname === '/api/posts' && req.method !== 'GET') {
          try {
            if (req.method === 'DELETE') {
              const slug = parsed.searchParams.get('slug');
              if (!slug) return sendJSON(res, 400, { error: '缺少 slug 参数' });
              await deletePostFile(slug);
              return sendJSON(res, 200, { success: true });
            }

            const raw = await readBody(req);
            const body = JSON.parse(raw);
            const { slug, frontmatter, body: postBody } = body;

            if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
              return sendJSON(res, 400, { error: 'Slug 只能包含小写字母、数字和连字符' });
            }
            await writePostToFile(slug, dataToFrontmatter(frontmatter), postBody);
            sendJSON(res, 200, { success: true, slug });
          } catch (e) {
            sendJSON(res, 400, { error: `请求处理失败: ${e.message}` });
          }
          return;
        }

        // --- /api/music (POST/DELETE only; GET stays in Astro) ---
        if (pathname === '/api/music' && req.method !== 'GET') {
          try {
            if (req.method === 'DELETE') {
              const index = parseInt(parsed.searchParams.get('index') || '-1', 10);
              if (index < 0) return sendJSON(res, 400, { error: '缺少 index 参数' });
              const tracks = await removeTrack(index);
              return sendJSON(res, 200, { success: true, tracks });
            }

            const raw = await readBody(req);
            const body = JSON.parse(raw);
            const { name, src, duration } = body;
            if (!name || !src || !duration) {
              return sendJSON(res, 400, { error: 'name、src、duration 均为必填' });
            }
            const tracks = await addTrack(name, src, duration);
            sendJSON(res, 200, { success: true, tracks });
          } catch (e) {
            sendJSON(res, 400, { error: `请求处理失败: ${e.message}` });
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  output: 'static',
  site: 'https://starrybreeze.github.io',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [apiPlugin(), tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
