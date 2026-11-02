import { profileSchema } from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';

// The profile columns come from the shared schema's keys, so there is one field list.
export const profileSelect = Object.fromEntries(
  Object.keys(profileSchema.shape).map((key) => [key, true]),
) as { [K in keyof typeof profileSchema.shape]: true } satisfies Prisma.ProfileSelect;

// What a visitor may see: the same fields minus the internal id and the published flag.
// The link-in-bio settings are not part of the portfolio itself (the card has its own endpoint).
const publicProfileShape = profileSchema.omit({
  id: true,
  published: true,
  linkBioEnabled: true,
  linkBioStyle: true,
  linkBioShowContact: true,
  linkBioShowVcard: true,
  linkBioShowResume: true,
  linkBioShowShare: true,
  linkBioShowWork: true,
}).shape;
export const publicProfileSelect = Object.fromEntries(
  Object.keys(publicProfileShape).map((key) => [key, true]),
) as { [K in keyof typeof publicProfileShape]: true } satisfies Prisma.ProfileSelect;

// The items of a custom section in display order (the section id is already known).
export const customItems = {
  omit: { sectionId: true },
  orderBy: [{ order: 'asc' }, { id: 'asc' }],
} satisfies Prisma.CustomSectionItemFindManyArgs;

// The owner's view of a testimonial: everything but the profile id, in display order. Pending ones
// have the highest orders, so they come last, oldest first.
export const myTestimonials = {
  omit: { profileId: true },
  orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
} satisfies Prisma.TestimonialFindManyArgs;

// The owner's link-in-bio buttons, in display order.
export const myLinkBioLinks = {
  omit: { profileId: true },
  orderBy: [{ order: 'asc' }, { id: 'asc' }],
} satisfies Prisma.LinkBioLinkFindManyArgs;

// A visitor's view: approved ones only, by an explicit list of fields, so the contact email and
// status can never reach the public page.
export const publicTestimonials = {
  where: { status: 'approved' },
  select: {
    id: true,
    authorName: true,
    authorRole: true,
    authorCompany: true,
    message: true,
    order: true,
  },
  orderBy: [{ order: 'asc' }, { id: 'asc' }],
} satisfies Prisma.TestimonialFindManyArgs;

// A section list in display order. profileId is dropped: the client already knows the profile.
export const orderedList = {
  omit: { profileId: true },
  orderBy: [{ order: 'asc' }, { id: 'asc' }],
} satisfies Prisma.SkillFindManyArgs;

// The editor's list of posts: everything but the body (which can be long). Newest first.
export const myPostSummaries = {
  omit: { profileId: true, body: true },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
} satisfies Prisma.PostFindManyArgs;

// A visitor's view of a published post. Never includes the profile id, status or draft fields.
export const publicPostSummarySelect = {
  id: true,
  title: true,
  slug: true,
  type: true,
  excerpt: true,
  externalUrl: true,
  coverImageUrl: true,
  publishedAt: true,
} satisfies Prisma.PostSelect;
