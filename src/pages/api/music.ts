import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MUSIC_PLAYER_PATH = path.resolve('src/components/ui/MusicPlayer.astro');

// --- helpers ---

interface Track {
  name: string;
  src: string;
  duration: string;
}

function parsePlaylist(content: string): Track[] {
  const match = content.match(/const playlist = \[([\s\S]*?)\];/);
  if (!match) return [];
  const tracks: Track[] = [];
  const regex = /\{\s*name:\s*'([^']*)',\s*src:\s*'([^']*)',\s*duration:\s*'([^']*)'\s*\}/g;
  let m;
  while ((m = regex.exec(match[1])) !== null) {
    tracks.push({ name: m[1], src: m[2], duration: m[3] });
  }
  return tracks;
}

function replacePlaylist(content: string, tracks: Track[]): string {
  const entries = tracks
    .map((t) => `      { name: '${t.name}', src: '${t.src}', duration: '${t.duration}' }`)
    .join(',\n');
  const newBlock = `const playlist = [\n${entries},\n    ];`;
  return content.replace(/const playlist = \[[\s\S]*?\];/, newBlock);
}

// --- Routes ---

export const GET: APIRoute = async () => {
  const content = await readFile(MUSIC_PLAYER_PATH, 'utf-8');
  const tracks = parsePlaylist(content);
  return new Response(JSON.stringify(tracks), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as { name: string; src: string; duration: string };
  const { name, src, duration } = body;

  if (!name || !src || !duration) {
    return new Response(JSON.stringify({ error: 'name、src、duration 均为必填' }), { status: 400 });
  }

  const content = await readFile(MUSIC_PLAYER_PATH, 'utf-8');
  const tracks = parsePlaylist(content);
  tracks.push({ name, src, duration });
  const newContent = replacePlaylist(content, tracks);
  await writeFile(MUSIC_PLAYER_PATH, newContent, 'utf-8');

  return new Response(JSON.stringify({ success: true, tracks }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const index = parseInt(url.searchParams.get('index') || '-1', 10);

  if (index < 0) {
    return new Response(JSON.stringify({ error: '缺少 index 参数' }), { status: 400 });
  }

  const content = await readFile(MUSIC_PLAYER_PATH, 'utf-8');
  const tracks = parsePlaylist(content);

  if (index >= tracks.length) {
    return new Response(JSON.stringify({ error: '曲目索引超出范围' }), { status: 404 });
  }

  tracks.splice(index, 1);
  const newContent = replacePlaylist(content, tracks);
  await writeFile(MUSIC_PLAYER_PATH, newContent, 'utf-8');

  return new Response(JSON.stringify({ success: true, tracks }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
