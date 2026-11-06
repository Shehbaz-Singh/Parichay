import { z } from 'zod';
import { ANNOUNCEMENT_LABEL_MAX, ANNOUNCEMENT_TEXT_MAX } from './announcement';
import { AVAILABILITY_MESSAGE_MAX } from './availability';
import { CUSTOM_DESCRIPTION_MAX, CUSTOM_SUBTITLE_MAX, CUSTOM_TITLE_MAX } from './custom-sections';
import { CONTACT_INTRO_MAX } from './contact';
import { LINK_BIO_LABEL_MAX } from './link-bio';
import { LOCALE_CODES } from './languages';
import { CUSTOM_PAGE_BODY_MAX, PAGE_TITLE_MAX } from './pages';
import { IMAGE_ALT_MAX } from './portfolio';
import { POST_BODY_MAX, POST_EXCERPT_MAX, POST_TITLE_MAX } from './posts';
import { SECTION_TITLE_MAX } from './section-config';
import { SHARE_MESSAGE_MAX } from './share';
import { optionalBlock, optionalLine } from './text';
import { WORK_NOTE_MAX } from './work-card';
import { VALIDATION } from './messages';

// What the owner can translate. Names, companies, institutions, links, dates, tech tags and the
// location stay as written, and so do testimonials (they are quotes).

export const TRANSLATABLE_ENTITIES = [
  'profile',
  'section', // the heading of a built-in section; entityId is the section key
  'experience',
  'education',
  'project',
  'skill',
  'customSection',
  'customItem',
  'post',
  'linkBioLink', // a custom button of the link-in-bio card; the address is shared by all languages
  'page', // the name of a built-in page; entityId is the page key
  'customPage', // a page the owner made: its title and text
  'projectImage', // the alt text of a gallery image
] as const;
export const translatableEntitySchema = z.enum(TRANSLATABLE_ENTITIES);
export type TranslatableEntity = z.infer<typeof translatableEntitySchema>;

export interface TranslatableField {
  max: number; // the same limit as the original field
  multiline: boolean;
  // Counted in the completeness figure. Skill names are optional to translate, so they are not.
  counts: boolean;
}

const line = (max: number, counts = true): TranslatableField => ({ max, multiline: false, counts });
const block = (max: number): TranslatableField => ({ max, multiline: true, counts: true });

export const TRANSLATABLE: Record<TranslatableEntity, Record<string, TranslatableField>> = {
  profile: {
    tagline: line(160),
    about: block(5000),
    availabilityMessage: line(AVAILABILITY_MESSAGE_MAX),
    workNote: line(WORK_NOTE_MAX),
    shareMessage: block(SHARE_MESSAGE_MAX),
    contactFormIntro: line(CONTACT_INTRO_MAX),
    announcementText: line(ANNOUNCEMENT_TEXT_MAX),
    announcementLinkLabel: line(ANNOUNCEMENT_LABEL_MAX, false),
  },
  section: { title: line(SECTION_TITLE_MAX) },
  experience: { title: line(100), description: block(3000) },
  education: { degree: line(150) },
  project: { name: line(100), description: block(3000), coverAlt: line(IMAGE_ALT_MAX, false) },
  skill: { name: line(60, false) },
  customSection: { title: line(CUSTOM_TITLE_MAX) },
  customItem: {
    title: line(CUSTOM_TITLE_MAX),
    subtitle: line(CUSTOM_SUBTITLE_MAX),
    description: block(CUSTOM_DESCRIPTION_MAX),
  },
  post: {
    title: line(POST_TITLE_MAX),
    excerpt: line(POST_EXCERPT_MAX),
    body: block(POST_BODY_MAX),
  },
  linkBioLink: { label: line(LINK_BIO_LABEL_MAX) },
  page: { title: line(PAGE_TITLE_MAX, false) },
  customPage: { title: line(PAGE_TITLE_MAX), body: block(CUSTOM_PAGE_BODY_MAX) },
  projectImage: { alt: line(IMAGE_ALT_MAX, false) },
};

export const fieldRule = (entity: TranslatableEntity, field: string) =>
  TRANSLATABLE[entity][field] as TranslatableField | undefined;

export const localeSchema = z.enum(LOCALE_CODES);

// One stored translation, as the editor reads and writes it. An empty value removes it.
const entityIdSchema = z.string().min(1).max(100);
const fieldNameSchema = z.string().min(1).max(40);

export const translationEntrySchema = z
  .object({
    entityType: translatableEntitySchema,
    entityId: entityIdSchema,
    field: fieldNameSchema,
    value: z.string().max(20000),
    // True while the text came from the AI suggestion and the owner has not edited it.
    needsReview: z.boolean().default(false),
  })
  .superRefine((entry, ctx) => {
    const rule = fieldRule(entry.entityType, entry.field);
    if (!rule) {
      ctx.addIssue({ code: 'custom', path: ['field'], message: VALIDATION.notTranslatable });
      return;
    }
    // The same cleaning and limit as the original field (plain text, no control characters).
    const parsed = (rule.multiline ? optionalBlock(rule.max) : optionalLine(rule.max)).safeParse(
      entry.value,
    );
    if (!parsed.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: VALIDATION.tooLong(rule.max),
      });
    }
  })
  .transform((entry) => {
    const rule = fieldRule(entry.entityType, entry.field)!;
    const clean = (rule.multiline ? optionalBlock(rule.max) : optionalLine(rule.max)).parse(
      entry.value,
    );
    return { ...entry, value: clean ?? '' };
  });
export type TranslationEntry = z.infer<typeof translationEntrySchema>;

export const MAX_ENTRIES_PER_SAVE = 100;
export const translationsSaveSchema = z.object({
  entries: z.array(translationEntrySchema).min(1).max(MAX_ENTRIES_PER_SAVE),
});
export type TranslationsSave = z.infer<typeof translationsSaveSchema>;

// What the API returns for a stored translation.
export const storedTranslationSchema = z.object({
  entityType: translatableEntitySchema,
  entityId: z.string(),
  field: z.string(),
  value: z.string(),
  needsReview: z.boolean(),
});
export type StoredTranslation = z.infer<typeof storedTranslationSchema>;

export const languageSettingsSchema = z.object({
  defaultLocale: localeSchema,
});
export const addLanguageSchema = z.object({ locale: localeSchema });

// How complete one language is.
export const languageStatusSchema = z.object({
  locale: localeSchema,
  total: z.number(), // fields that can be translated and have text in the default language
  translated: z.number(),
  needsReview: z.number(),
  percent: z.number(), // 0-100
  publishable: z.boolean(), // tagline and about (where the default has them) are translated
});
export type LanguageStatus = z.infer<typeof languageStatusSchema>;

export const myLanguagesSchema = z.object({
  defaultLocale: localeSchema,
  maxExtra: z.number(),
  languages: z.array(languageStatusSchema),
});
export type MyLanguages = z.infer<typeof myLanguagesSchema>;

// The AI suggestion for one field.
export const suggestRequestSchema = z.object({
  locale: localeSchema,
  entityType: translatableEntitySchema,
  entityId: entityIdSchema,
  field: fieldNameSchema,
});
export const SUGGESTIONS_PER_DAY = 40;

// Key of a translation inside a lookup map.
export const translationKey = (entity: string, id: string, field: string) =>
  `${entity}:${id}:${field}`;
