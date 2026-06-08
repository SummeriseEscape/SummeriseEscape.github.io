import type { APIRoute } from 'astro';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const IMAGES_DIR = path.resolve('public/images/posts');

function generateCoverSVG(title: string, category: string, mood: string): string {
  const colors: Record<string, string> = {
    tranquil: '#5A7892', nostalgic: '#B6A9C9', dreamy: '#AFC3D4',
    warm: '#E7C6C0', melancholic: '#31435A',
  };
  const accent = colors[mood] || '#5A7892';

  const shapes: Record<string, string> = {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as { title: string; category: string; mood: string; filename: string };
    const { title, category, mood, filename } = body;
    if (!title || !category || !mood || !filename) {
      return new Response(JSON.stringify({ error: '缺少必填字段: title, category, mood, filename' }), { status: 400 });
    }
    const svg = generateCoverSVG(title, category, mood);
    const filePath = path.join(IMAGES_DIR, filename.endsWith('.svg') ? filename : `${filename}.svg`);
    await writeFile(filePath, svg, 'utf-8');
    return new Response(JSON.stringify({ success: true, path: `/images/posts/${path.basename(filePath)}` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: `处理失败: ${e.message}` }), { status: 400 });
  }
};
