import { z } from 'zod';
import { httpUrl } from './portfolio';
import { optionalBlock, optionalLine, requiredLine } from './text';
import { VALIDATION } from './messages';

// The "Writing" section: short posts written here (Markdown), and links to articles published
// elsewhere. Drafts are only ever seen by their owner; only published posts reach the public API.
export const POST_TYPES = ['post', 'link'] as const;
export const postTypeSchema = z.enum(POST_TYPES);
export type PostType = z.infer<typeof postTypeSchema>;

export const POST_STATUSES = ['draft', 'published'] as const;
export const postStatusSchema = z.enum(POST_STATUSES);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const MAX_POSTS = 50;
export const POST_TITLE_MAX = 120;
export const POST_EXCERPT_MAX = 300;
export const POST_BODY_MAX = 20000;

// POST and PUT /profile/me/posts. The slug is made from the title when the post is created and then
// kept, so a link someone shared keeps working. The cover image has its own upload endpoint.
// A draft may be unfinished; publishing needs the part that makes the post worth reading. Only the
// field that matches the type is kept: a post has no link, and a link has no body.
export const postInputSchema = z
  .object({
    title: requiredLine(POST_TITLE_MAX),
    type: postTypeSchema.default('post'),
    excerpt: optionalLine(POST_EXCERPT_MAX),
    // Markdown. Never HTML: it is drawn as Markdown with HTML left out (see the frontend renderer).
    body: optionalBlock(POST_BODY_MAX),
    externalUrl: httpUrl.nullish().transform((v) => v ?? null),
    status: postStatusSchema.default('draft'),
  })
  .superRefine((post, ctx) => {
    if (post.status !== 'published') return;
    if (post.type === 'post' && !post.body) {
      ctx.addIssue({
        code: 'custom',
        path: ['body'],
        message: VALIDATION.postBodyRequired,
      });
    }
    if (post.type === 'link' && !post.externalUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['externalUrl'],
        message: VALIDATION.postLinkRequired,
      });
    }
  })
  .transform((post) =>
    post.type === 'post' ? { ...post, externalUrl: null } : { ...post, body: null },
  );
export type PostInput = z.infer<typeof postInputSchema>;

// Dates are ISO strings because they have been through JSON.
const iso = z.string();

// What the editor lists: everything but the body, which can be long (GET /profile/me/posts/:id has it).
export const myPostSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: postTypeSchema,
  excerpt: z.string().nullable(),
  externalUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  status: postStatusSchema,
  publishedAt: iso.nullable(),
  createdAt: iso,
  updatedAt: iso,
});
export const myPostSchema = myPostSummarySchema.extend({ body: z.string().nullable() });
export type MyPostSummary = z.infer<typeof myPostSummarySchema>;
export type MyPost = z.infer<typeof myPostSchema>;

// What a visitor gets for a published post. `publishedAt` is always set for one.
export const publicPostSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: postTypeSchema,
  excerpt: z.string().nullable(),
  externalUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  publishedAt: iso,
});
export const publicPostSchema = publicPostSummarySchema.extend({
  body: z.string().nullable(),
  updatedAt: iso,
});
export type PublicPostSummary = z.infer<typeof publicPostSummarySchema>;
