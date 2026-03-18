import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date(),
    shortnews: z.boolean().default(false),
    icon: z.string().default('newspaper'),
    displayimage: z
      .object({ src: z.string(), alt: z.string().default('') })
      .optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    status: z.enum(['active', 'inactive']).default('active'),
    date: z.coerce.date(),
    lastUpdated: z.coerce.date(),
    people: z.array(z.string()).default([]),
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/people' }),
  schema: z.object({
    id: z.string(),
    displayName: z.string(),
    role: z.enum(['faculty', 'postdoc', 'student', 'collab', 'ugrad-alum', 'alum']),
    bio: z.string().optional(),
    bioLong: z.string().optional(),
    image: z.string().optional(),
    webpage: z.string().optional(),
    twitter: z.string().optional(),
    mastodon: z.string().optional(),
    orcid: z.string().optional(),
    github: z.string().optional(),
    linkedin: z.string().optional(),
    nextRole: z.string().optional(),
    order: z.number().default(99),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '[^_]*.yaml', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.string(),
    journal: z.string(),
    year: z.number(),
    doi: z.string().optional(),
    url: z.string().optional(),
    abstract: z.string().optional(),
    volume: z.string().optional(),
    pages: z.string().optional(),
    isCover: z.boolean().default(false),
    coverImage: z.string().optional(),
    coverThumb: z.string().optional(),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/settings' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    twitter: z.string().optional(),
    github: z.string().optional(),
    orcid: z.string().optional(),
  }),
});

export const collections = { posts, projects, people, publications, settings };
