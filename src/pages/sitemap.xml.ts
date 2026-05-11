import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const pages = [
    { url: '/', lastmod: new Date() },
    { url: '/posts/', lastmod: new Date() },
    { url: '/about/', lastmod: new Date() },
    ...posts.map((post) => ({
      url: `/posts/${post.id.replace(/\.(mdx|md)$/, '')}/`,
      lastmod: post.data.updated ?? post.data.date,
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `  <url>
    <loc>https://starrybreeze.github.io${page.url}</loc>
    <lastmod>${page.lastmod.toISOString().split('T')[0]}</lastmod>
  </url>`
    )
    .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
