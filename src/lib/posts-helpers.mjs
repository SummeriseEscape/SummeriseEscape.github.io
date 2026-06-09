// Post CRUD helpers — shared between Astro API routes and Vite middleware
import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export const POSTS_DIR = path.resolve('src/content/posts');
export const IMAGES_DIR = path.resolve('public/images/posts');

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('Invalid frontmatter format');
  const data = yaml.load(match[1]);
  return { data, body: match[2] };
}

export function serializePost(data, body) {
  const fm = { ...data };
  if (fm.date instanceof Date) fm.date = fm.date.toISOString().split('T')[0];
  if (fm.updated instanceof Date) fm.updated = fm.updated.toISOString().split('T')[0];
  const yamlStr = yaml.dump(fm, { lineWidth: -1, quotingType: '"', forceQuotes: false });
  return `---\n${yamlStr}---\n\n${body}`;
}

export function dataToFrontmatter(d) {
  return {
    title: String(d.title || ''),
    date: d.date ? new Date(d.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    updated: d.updated ? new Date(d.updated).toISOString().split('T')[0] : undefined,
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

export async function readPost(filePath, slug) {
  const raw = await readFile(filePath, 'utf-8');
  const { data, body } = parseFrontmatter(raw);
  return { ...dataToFrontmatter(data), slug, body };
}

export async function writePostToFile(slug, data, body) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  await writeFile(filePath, serializePost(data, body), 'utf-8');
}

export async function deletePostFile(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!existsSync(filePath)) throw new Error('文章不存在');

  const post = await readPost(filePath, slug);
  await unlink(filePath);

  // Clean up associated image if unused
  if (post.image) {
    const imgName = post.image.replace('/images/posts/', '');
    const imgPath = path.join(IMAGES_DIR, imgName);
    if (existsSync(imgPath)) {
      const files = await readdir(POSTS_DIR);
      let usedByOthers = false;
      for (const f of files) {
        const p = await readPost(path.join(POSTS_DIR, f), f.replace('.mdx', ''));
        if (p.image === post.image) { usedByOthers = true; break; }
      }
      if (!usedByOthers) await unlink(imgPath);
    }
  }
}

export async function getAllPosts() {
  const files = await readdir(POSTS_DIR);
  const mdxFiles = files.filter((f) => f.endsWith('.mdx'));
  const posts = [];
  for (const file of mdxFiles) {
    const slug = file.replace(/\.mdx$/, '');
    posts.push(await readPost(path.join(POSTS_DIR, file), slug));
  }
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}
