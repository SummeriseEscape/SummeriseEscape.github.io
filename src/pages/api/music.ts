import type { APIRoute } from 'astro';
import { getTracks, addTrack, removeTrack } from '@/lib/music-helpers.mjs';

export const GET: APIRoute = async () => {
  const tracks = await getTracks();
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
  const tracks = await addTrack(name, src, duration);
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
  const tracks = await removeTrack(index);
  return new Response(JSON.stringify({ success: true, tracks }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
