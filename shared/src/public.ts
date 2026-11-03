import { z } from 'zod';
import { availabilityStatusSchema } from './availability';
import { publicContactFormSchema } from './contact';
import { myLinkBioButtonSchema } from './link-bio';
import { linkTypeSchema, profileSchema } from './portfolio';
import { myPostSummarySchema, publicPostSummarySchema } from './posts';
import { myTestimonialSchema, publicTestimonialSchema } from './testimonials';
import { preferredContactSchema, replyTimeSchema, workingHoursSchema } from './work-card';
import {
  SECTION_KEYS,
  customIdOf,
  defaultSectionConfig,
  isCustomKey,
  publicSectionSchema,
  sectionConfigSchema,
  type PublicSection,
  type SectionConfig,
} from './section-config';

// The body of GET /public/:slug. Dates are ISO strings because they have been through JSON.
// The top-level fields come from profileSchema, so a new profile field only needs adding there.

const isoDate = z.string();

export const publicLinkSchema = z.object({
  id: z.string(),
  type: linkTypeSchema,
  url: z.string(),
  order: z.number(),
});

export const publicSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
});

export const publicExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  description: z.string(),
  order: z.number(),
});

export const publicProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable(),
  description: z.string(),
  techTags: z.array(z.string()),
  featured: z.boolean(),
  order: z.number(),
});

export const publicEducationSchema = z.object({
  id: z.string(),
  degree: z.string(),
  institution: z.string(),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  order: z.number(),
});

// A section the user created. Dates are ISO strings, all optional.
export const publicCustomItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  startDate: isoDate.nullable(),
  endDate: isoDate.nullable(),
  url: z.string().nullable(),
  description: z.string().nullable(),
  order: z.number(),
});

export const publicCustomSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(publicCustomItemSchema),
});

// In the editor a custom section also carries its place in the page layout.
export const myCustomSectionSchema = publicCustomSectionSchema.extend({
  visible: z.boolean(),
  order: z.number(),
});

// The four ordered lists are identical in both views.
const sectionLists = {
  skills: z.array(publicSkillSchema),
  experience: z.array(publicExperienceSchema),
  projects: z.array(publicProjectSchema),
  education: z.array(publicEducationSchema),
};

// `sections` is the visible sections in page order. It defaults to everything so a page keeps
// working against an API that predates it. The content of a hidden section is left out by the API.
export const publicProfileSchema = profileSchema
  .omit({
    id: true,
    published: true,
    availabilityEnabled: true,
    availabilityStatus: true,
    availabilityMessage: true,
    workCardEnabled: true,
    timezone: true,
    workingHours: true,
    replyTime: true,
    preferredContact: true,
    workNote: true,
    contactFormEnabled: true,
    contactFormIntro: true,
    linkBioEnabled: true,
    linkBioStyle: true,
    linkBioShowContact: true,
    linkBioShowVcard: true,
    linkBioShowResume: true,
    linkBioShowShare: true,
    linkBioShowWork: true,
  })
  .extend({
    // Present only while the owner has the badge switched on; the API leaves all three out otherwise.
    availabilityEnabled: z.literal(true).optional(),
    availabilityStatus: availabilityStatusSchema.optional(),
    availabilityMessage: z.string().nullable().optional(),
    // The "Working together" card: all of these are left out unless the owner has it switched on.
    workCardEnabled: z.literal(true).optional(),
    timezone: z.string().nullable().optional(),
    workingHours: workingHoursSchema.optional(),
    replyTime: replyTimeSchema.nullable().optional(),
    preferredContact: preferredContactSchema.nullable().optional(),
    workNote: z.string().nullable().optional(),
    // The contact form: present only while the owner has it switched on (and the page is not a sample).
    contactForm: publicContactFormSchema.optional(),
    // The language this response is in (one of `locales`, or the default). `locales` here lists only
    // the extra languages that are ready for visitors.
    locale: z.string().default('en'),
    sections: z.array(publicSectionSchema).default(() => SECTION_KEYS.map((key) => ({ key }))),
    // The visible custom sections that have items, in page order. Each has an entry in `sections`.
    customSections: z.array(publicCustomSectionSchema).default([]),
    // Approved testimonials only, in the owner's order.
    testimonials: z.array(publicTestimonialSchema).default([]),
    // The latest published posts (up to 3) for the Writing section; empty while that section is hidden.
    // The full list is GET /public/:slug/posts.
    writing: z.array(publicPostSummarySchema).default([]),
    // True when there are more published posts than the three in `writing` (for a "View all" link).
    writingMore: z.boolean().default(false),
    links: z.array(publicLinkSchema),
    ...sectionLists,
  });

// The body of GET /profile/me: what the editor needs. Unlike the public view it keeps the
// profile id and published flag, and hidden links (with their visible flag).
export const myProfileSchema = profileSchema.extend({
  // All sections, hidden ones included, in page order (GET/PUT /profile/me/sections).
  sectionConfig: sectionConfigSchema.default(defaultSectionConfig),
  customSections: z.array(myCustomSectionSchema).default([]),
  // Every testimonial, pending and rejected included.
  testimonials: z.array(myTestimonialSchema).default([]),
  // The link-in-bio card's custom buttons, in order.
  linkBioLinks: z.array(myLinkBioButtonSchema).default([]),
  // Every post, drafts included, without the body (GET /profile/me/posts/:id has it).
  posts: z.array(myPostSummarySchema).default([]),
  links: z.array(publicLinkSchema.extend({ visible: z.boolean() })),
  ...sectionLists,
});

export type MyCustomSection = z.infer<typeof myCustomSectionSchema>;
export type PublicLink = z.infer<typeof publicLinkSchema>;
export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type MyProfile = z.infer<typeof myProfileSchema>;
export type MyLink = MyProfile['links'][number];

// What the page shows, from the section config: the visible sections in order, plus the custom
// sections they refer to. A custom section with no items is left out (a built-in one stays in the
// list and draws nothing when it is empty). Used by the public API and by the editor's preview, so
// they cannot disagree.
export function publicLayout<T extends { id: string; items: readonly unknown[] }>(
  config: SectionConfig,
  customSections: readonly T[],
): { sections: PublicSection[]; customSections: T[] } {
  const byId = new Map(customSections.map((section) => [section.id, section]));
  const sections: PublicSection[] = [];
  const custom: T[] = [];

  for (const { key, visible, title } of config) {
    if (!visible) continue;
    if (isCustomKey(key)) {
      const section = byId.get(customIdOf(key));
      if (!section || section.items.length === 0) continue;
      sections.push({ key });
      custom.push(section);
    } else {
      sections.push({ key, ...(title && { title }) });
    }
  }
  return { sections, customSections: custom };
}
