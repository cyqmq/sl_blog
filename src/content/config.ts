import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// 导航分类：每个分类一组链接（规则见下方 schema）
const nav = defineCollection({
  type: 'data',
  schema: z.array(
    z.object({
      title: z.string(),
      icon: z.string().optional(),
      links: z.array(
        z.object({
          name: z.string(),
          url: z.string(),
          desc: z.string().optional(),
          icon: z.string().optional(),
        })
      ),
    })
  ),
});

// 关于/个人资料（规则见下方 schema）
const about = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    handle: z.string().optional(),
    role: z.string().optional(),
    bio: z.array(z.string()).default([]),
    avatar: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    socials: z
      .array(
        z.object({
          name: z.string(),
          href: z.string(),
          icon: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const collections = { blog, nav, about };
