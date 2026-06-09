// Music playlist helpers — shared between Astro API routes and Vite middleware
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MUSIC_PLAYER_PATH = path.resolve('src/components/ui/MusicPlayer.astro');

export function parsePlaylist(content) {
  const match = content.match(/const playlist = \[([\s\S]*?)\];/);
  if (!match) return [];
  const tracks = [];
  const regex = /\{\s*name:\s*'([^']*)',\s*src:\s*'([^']*)',\s*duration:\s*'([^']*)'\s*\}/g;
  let m;
  while ((m = regex.exec(match[1])) !== null) {
    tracks.push({ name: m[1], src: m[2], duration: m[3] });
  }
  return tracks;
}

export function replacePlaylist(content, tracks) {
  const entries = tracks
    .map((t) => `      { name: '${t.name}', src: '${t.src}', duration: '${t.duration}' }`)
    .join(',\n');
  const newBlock = `const playlist = [\n${entries},\n    ];`;
  return content.replace(/const playlist = \[[\s\S]*?\];/, newBlock);
}

export async function getTracks() {
  const content = await readFile(MUSIC_PLAYER_PATH, 'utf-8');
  return parsePlaylist(content);
}

export async function addTrack(name, src, duration) {
  const content = await readFile(MUSIC_PLAYER_PATH, 'utf-8');
  const tracks = parsePlaylist(content);
  tracks.push({ name, src, duration });
  await writeFile(MUSIC_PLAYER_PATH, replacePlaylist(content, tracks), 'utf-8');
  return tracks;
}

export async function removeTrack(index) {
  const content = await readFile(MUSIC_PLAYER_PATH, 'utf-8');
  const tracks = parsePlaylist(content);
  if (index < 0 || index >= tracks.length) throw new Error('曲目索引超出范围');
  tracks.splice(index, 1);
  await writeFile(MUSIC_PLAYER_PATH, replacePlaylist(content, tracks), 'utf-8');
  return tracks;
}
