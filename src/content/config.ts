import { defineCollection, z } from 'astro:content';

// 文章 frontmatter 校验规则
// 新增文章时，在 .mdx 文件顶部填写以下字段。
// 修改 category/mood 枚举后，需同步更新 src/pages/posts/index.astro 中的分类列表
// 和 src/components/ui/MoodBadge.astro 中的情绪映射。
const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),                                                            // 文章标题
    date: z.coerce.date(),                                                        // 发布日期
    updated: z.date().optional(),                                                  // 最后更新日期（可选）
    excerpt: z.string(),                                                          // 文章摘要，显示在卡片和 SEO 描述中
    category: z.enum(['poetry', 'diary', 'essay', 'photography', 'music']),       // 分类：poetry=诗歌 diary=日记 essay=散文 photography=摄影 music=音乐
    mood: z.string(),                                                               // 情绪：自定义文本，常用值 tranquil=静谧 nostalgic=怀旧 dreamy=梦幻 warm=温暖 melancholic=忧郁
    image: z.string(),                                                            // 封面图片路径，例如 '/images/posts/xxx.jpg'
    imageAlt: z.string(),                                                         // 封面图片的替代文本（无障碍）
    tags: z.array(z.string()).optional(),                                          // 标签列表（可选），例如 ['夏天', '星空']
    draft: z.boolean().default(false),                                            // 草稿模式：true 时文章不会出现在任何列表/RSS/站点地图中
    featured: z.boolean().default(false),                                         // 精选文章：true 时文章会出现在首页，false 则仅在 /posts/ 列表页显示
  }),
});

export const collections = {
  posts: postsCollection,
};
