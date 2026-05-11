import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    excerpt: z.string(),
    category: z.enum(['poetry', 'diary', 'essay', 'photography', 'music']),
    mood: z.enum(['tranquil', 'nostalgic', 'dreamy', 'warm', 'melancholic']),
    image: z.string(),
    imageAlt: z.string(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  posts: postsCollection,
};
