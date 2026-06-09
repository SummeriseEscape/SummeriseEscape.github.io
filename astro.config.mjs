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

function generateCoverSVG(title, category, mood) {
  const colors = { tranquil: '#5A7892', nostalgic: '#B6A9C9', dreamy: '#AFC3D4', warm: '#E7C6C0', melancholic: '#31435A' };
  const accent = colors[mood] || '#5A7892';
  const shapes = {
    poetry: '<circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3"/><circle cx="320" cy="240" r="100" fill="none" stroke="currentColor" stroke-width="0.3" opacity="0.15"/>',
    diary: '<rect x="80" y="60" width="120" height="100" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.25" transform="rotate(-5 140 110)"/>',
    essay: '<polygon points="200,50 350,200 200,350 50,200" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.2"/>',
    photography: '<rect x="60" y="60" width="280" height="200" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3" rx="4"/><circle cx="200" cy="160" r="40" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.2"/>',
    music: '<circle cx="200" cy="180" r="80" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.25"/><circle cx="200" cy="180" r="20" fill="currentColor" opacity="0.15"/>',
  };
  const shape = shapes[category] || shapes.essay;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.08"/>
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0.02"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  ${shape}
  <line x1="30" y1="30" x2="50" y2="30" stroke="${accent}" stroke-width="1" opacity="0.3"/>
  <line x1="30" y1="30" x2="30" y2="50" stroke="${accent}" stroke-width="1" opacity="0.3"/>
  <line x1="370" y1="270" x2="350" y2="270" stroke="${accent}" stroke-width="1" opacity="0.3"/>
  <line x1="370" y1="270" x2="370" y2="250" stroke="${accent}" stroke-width="1" opacity="0.3"/>
  <text x="200" y="155" text-anchor="middle" font-family="serif" font-size="22" fill="${accent}" opacity="0.5" letter-spacing="0.15em">${title}</text>
  <text x="200" y="180" text-anchor="middle" font-family="sans-serif" font-size="11" fill="${accent}" opacity="0.25" letter-spacing="0.2em">${category}</text>
</svg>`;
}

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

            if (!slug || !/^[\w一-鿿-]+$/.test(slug)) {
              return sendJSON(res, 400, { error: 'Slug 包含无效字符' });
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

        // --- /api/images (POST only) ---
        if (pathname === '/api/images' && req.method === 'POST') {
          try {
            const raw = await readBody(req);
            const { title, category, mood, filename } = JSON.parse(raw);
            if (!title || !category || !mood || !filename) {
              return sendJSON(res, 400, { error: '缺少必填字段: title, category, mood, filename' });
            }
            const svg = generateCoverSVG(title, category, mood);
            const svgFilename = filename.endsWith('.svg') ? filename : `${filename}.svg`;
            await writeFile(path.join(IMAGES_DIR, svgFilename), svg, 'utf-8');
            sendJSON(res, 200, { success: true, path: `/images/posts/${svgFilename}` });
          } catch (e) {
            sendJSON(res, 400, { error: `处理失败: ${e.message}` });
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
