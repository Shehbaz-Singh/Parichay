import { CONTACT_INTRO_MAX } from './contact';
import { DEFAULT_LINK_BIO_STYLE, linkBioStyleSchema } from './link-bio';
import { z } from 'zod';
import {
  AVAILABILITY_MESSAGE_MAX,
  DEFAULT_AVAILABILITY_STATUS,
  availabilityStatusSchema,
} from './availability';
import { isLocaleCode } from './languages';
import { optionalBlock, optionalLine } from './text';
import { SHARE_MESSAGE_MAX } from './share';
import { VALIDATION } from './messages';
import {
  WORK_NOTE_MAX,
  closedWeek,
  preferredContactSchema,
  replyTimeSchema,
  timeZoneSchema,
  workingHoursSchema,
} from './work-card';

// Request-body schemas for the portfolio models. Dates are accepted as ISO strings
// (e.g. "2024-06-01") and coerced to Date objects.

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

// Only http(s): z.string().url() also accepts "javascript:..." which is an XSS risk once
// the value is rendered as a link on the public page.
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), VALIDATION.urlScheme);

// Optional: when omitted on create the item is appended; on update it keeps its position.
const orderField = z.number().int().min(0).optional();

// Slugs become public URLs (/[slug]), so they must not collide with app routes.
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'login',
  'register',
  'signup',
  'dashboard',
  'settings',
  'about',
  'privacy',
  'terms',
  'writing',
  'links',
  '_next',
] as const;

// The addresses of the sample profiles (samples.ts). Public like any other page, but nobody can
// register one. Keep in step with SAMPLE_PROFILES (the seed script checks).
export const SAMPLE_SLUGS = [
  'tanisha-walia',
  'ayush-gill',
  'navjot-singh',
  'sameer-bhatia',
  'syed-abraar',
] as const;

export const isReservedSlug = (slug: string) =>
  (RESERVED_SLUGS as readonly string[]).includes(slug) ||
  (SAMPLE_SLUGS as readonly string[]).includes(slug) ||
  isLocaleCode(slug);

// The shape of an address, for reading one (a public page may be a reserved sample address).
export const slugFormatSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, VALIDATION.slugFormat);

// The address a person may choose: the right shape and not reserved.
export const slugSchema = slugFormatSchema.refine(
  (s) => !isReservedSlug(s),
  'This slug is reserved',
);

// The themes a profile may choose. The frontend's theme registry has an entry for each key (its
// type is a Record over this list), so adding a theme means adding the key here and the entry
// there. Only these keys are accepted when saving.
export const THEME_KEYS = ['editorial', 'bento', 'soft', 'executive', 'creative'] as const;
export const themeSchema = z.enum(THEME_KEYS);
export type ThemeKey = z.infer<typeof themeSchema>;
export const DEFAULT_THEME: ThemeKey = 'editorial';

export const DEFAULT_ACCENT = '#2563eb';

// Exactly #RRGGBB (no shorthand, no alpha, no names): the value is placed in a CSS variable on
// the public page, so nothing else may get through. Stored lowercase.
export const accentColorSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, VALIDATION.hexColor);

// Lengths the forms show next to their fields.
export const FULL_NAME_MAX = 100;
export const ABOUT_MAX = 5000;
export const DESCRIPTION_MAX = 3000; // a job's or a project's description

export const linkTypeSchema = z.enum(['linkedin', 'github', 'email', 'phone', 'website', 'other']);
export type LinkType = z.infer<typeof linkTypeSchema>;

export const profileInputSchema = z.object({
  slug: slugSchema,
  fullName: trimmed(FULL_NAME_MAX),
  tagline: optionalText(160),
  about: optionalText(ABOUT_MAX),
  location: optionalText(100),
  avatarUrl: httpUrl.nullish().transform((v) => v ?? null),
  theme: themeSchema.default(DEFAULT_THEME),
  accentColor: accentColorSchema.default(DEFAULT_ACCENT),
  published: z.boolean().default(false),
  // Whether visitors may submit testimonials (see testimonials.ts). Changed by its own endpoint.
  acceptTestimonials: z.boolean().default(false),
  // The availability badge (see availability.ts). The message is one line of plain text.
  availabilityEnabled: z.boolean().default(false),
  availabilityStatus: availabilityStatusSchema.default(DEFAULT_AVAILABILITY_STATUS),
  availabilityMessage: optionalLine(AVAILABILITY_MESSAGE_MAX),
  // Whether the public page offers a "Download resume" PDF made from it (/<slug>/resume.pdf).
  resumeEnabled: z.boolean().default(true),
  // Whether the public page offers an "Add to contacts" vCard (/<slug>/contact.vcf), and whether the
  // card includes the profile photo (contact-card.ts). Both are off until the owner switches them on.
  contactCardEnabled: z.boolean().default(false),
  contactCardPhoto: z.boolean().default(false),
  // The "Working together" card (work-card.ts): when to reach the owner. Public only while enabled.
  workCardEnabled: z.boolean().default(false),
  timezone: timeZoneSchema.nullish().transform((zone) => zone ?? null),
  workingHours: workingHoursSchema.nullish().transform((week) => week ?? closedWeek()),
  replyTime: replyTimeSchema.nullish().transform((reply) => reply ?? null),
  preferredContact: preferredContactSchema.nullish().transform((contact) => contact ?? null),
  workNote: optionalLine(WORK_NOTE_MAX),
  // The suggested message of the Share menu (share.ts). Null means the default for the language.
  shareMessage: optionalBlock(SHARE_MESSAGE_MAX),
  // The contact form (contact.ts): whether visitors can write to the owner, and a line above it.
  // Changed by its own endpoint, together with the section that shows it.
  contactFormEnabled: z.boolean().default(false),
  contactFormIntro: optionalLine(CONTACT_INTRO_MAX),
  // The link-in-bio card (link-bio.ts): on or off, its look, and which optional buttons it shows.
  // Changed by its own endpoint, which also checks that the page is published.
  linkBioEnabled: z.boolean().default(false),
  linkBioStyle: linkBioStyleSchema.default(DEFAULT_LINK_BIO_STYLE),
  linkBioShowContact: z.boolean().default(true),
  linkBioShowVcard: z.boolean().default(true),
  linkBioShowResume: z.boolean().default(true),
  linkBioShowShare: z.boolean().default(true),
  linkBioShowWork: z.boolean().default(true),
});

// A stored profile: the same fields as the input, plus its id. Deriving it here means adding
// a profile field is a one-place change (the backend's Prisma select reads these keys too).
// `theme` is a plain string when read: the whitelist applies to what is saved, and a stored value
// that is no longer offered must not break the page (the frontend falls back to the default).
// A stored profile may hold a reserved address (the samples do), so it is read by shape only.
export const profileSchema = profileInputSchema.extend({
  slug: slugFormatSchema,
  id: z.string(),
  theme: z.string(),
  // A made-up example profile (samples.ts). Set by the seed script only: it is not in
  // profileInputSchema, so no request can change it.
  isSample: z.boolean().default(false),
  // The language the profile is written in, and the extra ones it offers (languages.ts). Changed by
  // the languages endpoints only, so they are not in profileInputSchema.
  defaultLocale: z.string().default('en'),
  locales: z.array(z.string()).default([]),
});
export type Profile = z.infer<typeof profileSchema>;

// PUT /profile/me. Publishing has its own endpoint, and omitting the slug keeps the current one.
export const profileUpdateSchema = profileInputSchema
  .omit({
    slug: true,
    published: true,
    acceptTestimonials: true,
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
  .extend({ slug: slugSchema.optional() });
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// POST /profile/me/publish. No value toggles; a value sets it (safe to retry).
export const publishSchema = z.object({ published: z.boolean().optional() });
export type PublishInput = z.infer<typeof publishSchema>;

const PHONE = /^\+?[\d\s().-]{5,25}$/;

export const linkInputSchema = z
  .object({
    type: linkTypeSchema,
    url: trimmed(2048),
    visible: z.boolean().default(true),
    order: orderField,
  })
  .superRefine((link, ctx) => {
    const valid =
      link.type === 'email'
        ? z.string().email().safeParse(link.url).success
        : link.type === 'phone'
          ? PHONE.test(link.url)
          : httpUrl.safeParse(link.url).success;
    if (!valid) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message:
          link.type === 'email'
            ? 'Must be a valid email address'
            : link.type === 'phone'
              ? 'Must be a valid phone number'
              : 'Must be a valid http(s) URL',
      });
    }
  });
export type LinkInput = z.infer<typeof linkInputSchema>;

export const skillInputSchema = z.object({
  name: trimmed(60),
  order: orderField,
});
export type SkillInput = z.infer<typeof skillInputSchema>;

const dateRange = <T extends { startDate: Date; endDate: Date | null }>(v: T) =>
  v.endDate === null || v.endDate >= v.startDate;
const dateRangeIssue = { message: VALIDATION.endBeforeStart, path: ['endDate'] };

export const experienceInputSchema = z
  .object({
    title: trimmed(100),
    company: trimmed(100),
    startDate: z.coerce.date(),
    endDate: z.coerce
      .date()
      .nullish()
      .transform((v) => v ?? null),
    description: z.string().trim().max(DESCRIPTION_MAX).default(''),
    order: orderField,
  })
  .refine(dateRange, dateRangeIssue);
export type ExperienceInput = z.infer<typeof experienceInputSchema>;

// Projects the owner can feature to lead the public page, and how many a page shows before the rest
// go behind "more" (a few projects are all shown).
export const FEATURED_PROJECTS_MAX = 6;

export const projectInputSchema = z.object({
  name: trimmed(100),
  url: httpUrl.nullish().transform((v) => v ?? null),
  description: z.string().trim().max(DESCRIPTION_MAX).default(''),
  techTags: z.array(trimmed(30)).max(20).default([]),
  featured: z.boolean().default(false),
  order: orderField,
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const educationInputSchema = z
  .object({
    degree: trimmed(150),
    institution: trimmed(150),
    startDate: z.coerce.date(),
    endDate: z.coerce
      .date()
      .nullish()
      .transform((v) => v ?? null),
    order: orderField,
  })
  .refine(dateRange, dateRangeIssue);
export type EducationInput = z.infer<typeof educationInputSchema>;

// ---- Sections: the five lists under a profile, managed through one generic API ----

export const SECTIONS = ['experience', 'education', 'projects', 'skills', 'links'] as const;
export type Section = (typeof SECTIONS)[number];
export const isSection = (value: string): value is Section =>
  (SECTIONS as readonly string[]).includes(value);

export const sectionInputSchemas = {
  experience: experienceInputSchema,
  education: educationInputSchema,
  projects: projectInputSchema,
  skills: skillInputSchema,
  links: linkInputSchema,
} satisfies Record<Section, z.ZodTypeAny>;

// Keeps one account from filling the database.
export const SECTION_LIMITS: Record<Section, number> = {
  experience: 30,
  education: 20,
  projects: 30,
  skills: 60,
  links: 20,
};

// PATCH /profile/me/:section/reorder
export const reorderSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, 'ids must be unique'),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

// A whole portfolio in one payload (used by the seed script and later by resume auto-fill).
export const fullProfileInputSchema = profileInputSchema.extend({
  links: z.array(linkInputSchema).default([]),
  skills: z.array(skillInputSchema).default([]),
  experience: z.array(experienceInputSchema).default([]),
  projects: z.array(projectInputSchema).default([]),
  education: z.array(educationInputSchema).default([]),
});
