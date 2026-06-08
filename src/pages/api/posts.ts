import type { APIRoute } from 'astro';
import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const POSTS_DIR = path.resolve('src/content/posts');
const IMAGES_DIR = path.resolve('public/images/posts');

// --- helpers ---

interface PostFrontmatter {
  title: string;
  date: string;
  updated?: string;
  excerpt: string;
  category: string;
  mood: string;
  image: string;
  imageAlt: string;
  tags?: string[];
  draft?: boolean;
  featured?: boolean;
}

interface PostData extends PostFrontmatter {
  slug: string;
  body: string;
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('Invalid frontmatter format');
  const data = yaml.load(match[1]) as Record<string, unknown>;
  return { data, body: match[2] };
}

function serializePost(data: PostFrontmatter, body: string): string {
  const fm: Record<string, unknown> = { ...data };
  // Ensure date is YYYY-MM-DD
  if (fm.date instanceof Date) {
    fm.date = (fm.date as Date).toISOString().split('T')[0];
  }
  if (fm.updated instanceof Date) {
    fm.updated = (fm.updated as Date).toISOString().split('T')[0];
  }
  const yamlStr = yaml.dump(fm, { lineWidth: -1, quotingType: '"', forceQuotes: false });
  return `---\n${yamlStr}---\n\n${body}`;
}

function dataToFrontmatter(d: Record<string, unknown>): PostFrontmatter {
  return {
    title: String(d.title || ''),
    date: d.date ? new Date(d.date as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    updated: d.updated ? new Date(d.updated as string).toISOString().split('T')[0] : undefined,
    excerpt: String(d.excerpt || ''),
    category: String(d.category || 'essay'),
    mood: String(d.mood || 'tranquil'),
    image: String(d.image || ''),
    imageAlt: String(d.imageAlt || ''),
    tags: Array.isArray(d.tags) ? d.tags.map(String) : undefined,
    draft: Boolean(d.draft),
    featured: Boolean(d.featured),
  };
}

async function readPost(filePath: string, slug: string): Promise<PostData> {
  const raw = await readFile(filePath, 'utf-8');
  const { data, body } = parseFrontmatter(raw);
  return { ...dataToFrontmatter(data), slug, body };
}

async function writePost(slug: string, data: PostFrontmatter, body: string): Promise<void> {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  await writeFile(filePath, serializePost(data, body), 'utf-8');
}

// --- Routes ---

export const GET: APIRoute = async () => {
  const files = await readdir(POSTS_DIR);
  const mdxFiles = files.filter((f) => f.endsWith('.mdx'));
  const posts: PostData[] = [];
  for (const file of mdxFiles) {
    const slug = file.replace(/\.mdx$/, '');
    const post = await readPost(path.join(POSTS_DIR, file), slug);
    posts.push(post);
  }
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as { slug: string; frontmatter: PostFrontmatter; body: string };
  const { slug, frontmatter, body: postBody } = body;
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Slug 只能包含小写字母、数字和连字符' }), { status: 400 });
  }

  await writePost(slug, dataToFrontmatter(frontmatter), postBody);
  return new Response(JSON.stringify({ success: true, slug }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json() as { slug: string; frontmatter: PostFrontmatter; body: string };
  const { slug, frontmatter, body: postBody } = body;
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);

  if (!existsSync(filePath)) {
    return new Response(JSON.stringify({ error: '文章不存在' }), { status: 404 });
  }

  await writePost(slug, dataToFrontmatter(frontmatter), postBody);
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

  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!existsSync(filePath)) {
    return new Response(JSON.stringify({ error: '文章不存在' }), { status: 404 });
  }

  // Read the post to find associated image
  const post = await readPost(filePath, slug);
  await unlink(filePath);

  // Delete associated image if it exists and isn't used by other posts
  if (post.image) {
    const imgName = post.image.replace('/images/posts/', '');
    const imgPath = path.join(IMAGES_DIR, imgName);
    if (existsSync(imgPath)) {
      // Check if other posts use the same image
      const files = await readdir(POSTS_DIR);
      let usedByOthers = false;
      for (const f of files) {
        if (f === `${slug}.mdx`) continue;
        const p = await readPost(path.join(POSTS_DIR, f), f.replace('.mdx', ''));
        if (p.image === post.image) {
          usedByOthers = true;
          break;
        }
      }
      if (!usedByOthers) {
        await unlink(imgPath);
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
