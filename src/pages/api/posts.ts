import type { APIRoute } from 'astro';
import { getAllPosts, writePostToFile, deletePostFile, dataToFrontmatter } from '@/lib/posts-helpers.mjs';
import path from 'node:path';
import { POSTS_DIR } from '@/lib/posts-helpers.mjs';
import { existsSync } from 'node:fs';

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  // Handled by Vite middleware in dev; this is a build-time fallback
  const body = await request.json() as { slug: string; frontmatter: any; body: string };
  const { slug, frontmatter, body: postBody } = body;
  if (!slug || !/^[\w一-鿿-]+$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Slug 包含无效字符' }), { status: 400 });
  }
  await writePostToFile(slug, dataToFrontmatter(frontmatter), postBody);
  return new Response(JSON.stringify({ success: true, slug }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json() as { slug: string; frontmatter: any; body: string };
  const { slug, frontmatter, body: postBody } = body;
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!existsSync(filePath)) {
    return new Response(JSON.stringify({ error: '文章不存在' }), { status: 404 });
  }
  await writePostToFile(slug, dataToFrontmatter(frontmatter), postBody);
  return new Response(JSON.stringify({ success: true, slug }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: '缺少 slug 参数' }), { status: 400 });
  }
  await deletePostFile(slug);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
