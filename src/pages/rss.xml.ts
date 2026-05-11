import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@/utils/constants';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: import.meta.env.SITE ?? 'https://starrybreeze.github.io',
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: `/posts/${post.id.replace(/\.(mdx|md)$/, '')}/`,
    })),
    customData: `<language>zh-CN</language>`,
  });
}
