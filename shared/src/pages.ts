import { z } from 'zod';
import { isLocaleCode } from './languages';
import { layoutModeSchema } from './layout-mode';
import { VALIDATION } from './messages';
import {
  SECTION_KEYS,
  isCustomKey,
  sectionConfigItemSchema,
  type ConfigKey,
} from './section-config';
import { optionalBlock, requiredLine } from './text';

// One page, or a site of pages. In single mode the portfolio is /<slug> and nothing here applies. In
// multi mode /<slug> is a short Home page and the sections live on pages of their own: the built-in
// ones (Work, About, Writing, Contact) and up to MAX_CUSTOM_PAGES the owner adds (/<slug>/p/<page>).
//
// Pages are layout only, like the section config: Profile.pageConfig says which pages are shown,
// what they are called, in what order, and which sections each takes. Single mode ignores it, so
// switching modes loses nothing. A custom page's own text is the CustomPage table.

export const PAGE_KEYS = ['home', 'work', 'about', 'writing', 'contact'] as const;
export const pageKeySchema = z.enum(PAGE_KEYS);
export type PageKey = z.infer<typeof pageKeySchema>;

// The address of each built-in page under /<slug> ("" is the Home page).
export const PAGE_PATHS: Record<PageKey, string> = {
  home: '',
  work: 'work',
  about: 'about',
  writing: 'writing',
  contact: 'contact',
};

// The name of a page in the navigation, when the owner has not renamed it.
export const PAGE_LABELS: Record<PageKey, string> = {
  home: 'Home',
  work: 'Work',
  about: 'About',
  writing: 'Writing',
  contact: 'Contact',
};

export const PAGE_TITLE_MAX = 30;
export const MAX_CUSTOM_PAGES = 3;
export const CUSTOM_PAGE_BODY_MAX = 5000;
export const CUSTOM_PAGE_SLUG_MIN = 2;
export const CUSTOM_PAGE_SLUG_MAX = 30;

// ---- keys: "home" ... for the built-in pages, "page:<id>" for a custom one
const CUSTOM_PAGE_PREFIX = 'page:';
export type CustomPageKey = `${typeof CUSTOM_PAGE_PREFIX}${string}`;
export type AnyPageKey = PageKey | CustomPageKey;

export const customPageKey = (id: string): CustomPageKey => `${CUSTOM_PAGE_PREFIX}${id}`;
export const isCustomPageKey = (key: string): key is CustomPageKey =>
  key.startsWith(CUSTOM_PAGE_PREFIX);
export const customPageIdOf = (key: CustomPageKey) => key.slice(CUSTOM_PAGE_PREFIX.length);

const customPageKeySchema = z.custom<CustomPageKey>(
  (value) => typeof value === 'string' && /^page:[a-z0-9]{8,40}$/.test(value),
  'Not a valid page key',
);

// ---- custom page addresses: /<slug>/p/<address>
// The address is under /p/, so it cannot clash with a page name; the words below are still refused so
// that /p/work never looks like /work, and so that a language code is never a page.
export const RESERVED_PAGE_SLUGS = [
  ...PAGE_KEYS,
  'p',
  'links',
  'resume',
  'send',
  'admin',
  'api',
  'new',
  'edit',
] as const;

export const isReservedPageSlug = (slug: string) =>
  (RESERVED_PAGE_SLUGS as readonly string[]).includes(slug) || isLocaleCode(slug);

export const customPageSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(CUSTOM_PAGE_SLUG_MIN)
  .max(CUSTOM_PAGE_SLUG_MAX)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, VALIDATION.slugFormat)
  .refine((slug) => !isReservedPageSlug(slug), VALIDATION.pageSlugReserved);

// POST and PUT /profile/me/custom-pages. Without a slug one is made from the title on create and the
// current one is kept on update.
export const customPageInputSchema = z.object({
  title: requiredLine(PAGE_TITLE_MAX),
  slug: customPageSlugSchema.optional(),
  // Plain text or limited Markdown (the same renderer as a post); never HTML.
  body: optionalBlock(CUSTOM_PAGE_BODY_MAX),
});
export type CustomPageInput = z.infer<typeof customPageInputSchema>;

export const myCustomPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  body: z.string().nullable(),
});
export type MyCustomPage = z.infer<typeof myCustomPageSchema>;

// ---- the page list

export const pageConfigItemSchema = z.object({
  key: z.union([pageKeySchema, customPageKeySchema]),
  visible: z.boolean(),
  // The owner's name for a built-in page; blank or missing means the default. A custom page's name is
  // its own title.
  title: z
    .string()
    .trim()
    .max(PAGE_TITLE_MAX)
    .nullish()
    .transform((title) => title || undefined),
  // The sections on this page, in order: section keys (section-config.ts). Home has none, it is
  // a short page made of pieces of the others.
  sections: z.array(sectionConfigItemSchema.shape.key).default([]),
});
export type PageConfigItem = z.infer<typeof pageConfigItemSchema>;

export const pageConfigSchema = z
  .array(pageConfigItemSchema)
  .max(PAGE_KEYS.length + MAX_CUSTOM_PAGES)
  .superRefine((items, ctx) => {
    const pages = new Set<string>();
    const sections = new Set<string>();
    items.forEach((item, index) => {
      if (pages.has(item.key)) {
        ctx.addIssue({ code: 'custom', path: [index, 'key'], message: VALIDATION.pageRepeated });
      }
      pages.add(item.key);
      item.sections.forEach((section, at) => {
        if (sections.has(section)) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'sections', at],
            message: VALIDATION.sectionRepeated(section),
          });
        }
        sections.add(section);
      });
    });
  });
export type PageConfig = PageConfigItem[];

// Where a section goes when nobody has said: the work (projects and jobs) on Work, the person (About,
// skills, education, quotes) on About, and Writing and Contact on the page of their own name.
const HOME_SECTION: Record<string, PageKey> = {
  projects: 'work',
  experience: 'work',
  writing: 'writing',
  contact: 'contact',
};
const defaultPageOf = (section: string): PageKey => HOME_SECTION[section] ?? 'about';

// The built-in order, all shown; the custom pages after them. Used for "Split my portfolio into
// pages" and for a profile that has never been set up.
export function defaultPageConfig(
  customPageIds: readonly string[] = [],
  sections: readonly string[] = SECTION_KEYS,
): PageConfig {
  return normalizePageConfig([], customPageIds, sections);
}

// Turns whatever is stored (or sent) into a complete, valid page list. Home is always first and
// always shown, with no sections. A page missing from the list is added (shown); an entry for a custom
// page that does not exist is dropped. `sections` are the keys of the profile's real sections: one
// that is gone is removed from its page, and one that is on no page goes to its default page. So the
// result always matches what exists, and a damaged value can never break a page.
export function normalizePageConfig(
  raw: unknown,
  customPageIds: readonly string[] = [],
  sections: readonly string[] = SECTION_KEYS,
): PageConfig {
  const ownPages = new Set(customPageIds);
  const known = new Set<string>(sections);
  const seenPages = new Set<string>();
  const seenSections = new Set<string>();
  const items: PageConfig = [];

  for (const entry of Array.isArray(raw) ? raw : []) {
    // A section key that is not one is dropped on its own; it must not cost the page its settings.
    const cleaned =
      entry &&
      typeof entry === 'object' &&
      Array.isArray((entry as { sections?: unknown }).sections)
        ? {
            ...entry,
            sections: (entry as { sections: unknown[] }).sections.filter(
              (key) => typeof key === 'string' && isSectionKey(key),
            ),
          }
        : entry;
    const parsed = pageConfigItemSchema.safeParse(cleaned);
    if (!parsed.success) continue;
    const { key, visible, title, sections: keys } = parsed.data;
    if (seenPages.has(key)) continue;
    if (isCustomPageKey(key) && !ownPages.has(customPageIdOf(key))) continue;
    seenPages.add(key);
    const mine: ConfigKey[] = [];
    for (const s of key === 'home' ? [] : keys) {
      if (!known.has(s) || seenSections.has(s)) continue;
      seenSections.add(s);
      mine.push(s);
    }
    items.push({
      key,
      visible: key === 'home' ? true : visible,
      title: isCustomPageKey(key) ? undefined : title,
      sections: mine,
    });
  }

  for (const key of PAGE_KEYS) {
    if (!seenPages.has(key)) items.push({ key, visible: true, sections: [] });
  }
  for (const id of customPageIds) {
    const key = customPageKey(id);
    if (!seenPages.has(key)) items.push({ key, visible: true, sections: [] });
  }

  // Sections that are on no page go to their default page, after the ones already there.
  for (const section of sections) {
    if (seenSections.has(section)) continue;
    const target = items.find((item) => item.key === defaultPageOf(section));
    target?.sections.push(section as ConfigKey);
  }

  // Home first.
  const home = items.findIndex((item) => item.key === 'home');
  if (home > 0) items.unshift(...items.splice(home, 1));
  return items;
}

// PUT /profile/me/pages: the mode and the page list together, so a mode switch and its arrangement
// are one save. The list is repaired against what exists (normalizePageConfig), so a section or page
// that is not the caller's is dropped rather than trusted.
export const pagesUpdateSchema = z.object({
  layoutMode: layoutModeSchema,
  pages: pageConfigSchema,
  // Whether the sitemap lists the pages; left out keeps the current choice.
  sitemapListed: z.boolean().optional(),
});
export type PagesUpdateInput = z.infer<typeof pagesUpdateSchema>;

// ---- what a visitor gets

export const publicPageSchema = z.object({
  key: z.string(), // "home", "work", ... or "page:<id>"
  // The owner's name for the page (translated). Missing: the default name in the visitor's language.
  title: z.string().optional(),
  // Custom pages only: the address under /p/ and the text.
  slug: z.string().optional(),
  body: z.string().nullable().optional(),
  // The sections that draw on this page, in order: shown, and with something to show.
  sections: z.array(z.string()).default([]),
});
export type PublicPage = z.infer<typeof publicPageSchema>;

export interface ResolveInput {
  config: PageConfig;
  customPages: readonly { id: string; slug: string; title: string; body: string | null }[];
  // The keys of the sections the profile shows (all that are visible), and whether each has
  // something to draw.
  visibleSections: readonly string[];
  hasContent: (sectionKey: string) => boolean;
  // The Contact page has more than a section: the owner's links, the contact form, the working-together card.
  hasContactDetails: boolean;
  // The owner's names for the built-in pages, in the language asked for, and the custom pages' texts.
  titleOf?: (key: AnyPageKey, fallback: string | undefined) => string | undefined;
}

// The pages of a multi-page profile that exist for a visitor, in navigation order. A page the owner
// hid, and a page with nothing on it, is not in the list (so it is not in the navigation or the
// sitemap, and its address is a 404). Home is always there. This is the one place that decides it,
// used by the API, so a theme never has to.
export function resolvePublicPages(input: ResolveInput): PublicPage[] {
  const shown = new Set(input.visibleSections);
  const custom = new Map(input.customPages.map((page) => [customPageKey(page.id), page]));
  const pages: PublicPage[] = [];

  for (const item of input.config) {
    if (!item.visible) continue;
    const own = custom.get(item.key as CustomPageKey);
    if (isCustomPageKey(item.key) && !own) continue;
    const sections = item.sections.filter((key) => shown.has(key) && input.hasContent(key));
    const filled =
      item.key === 'home' ||
      sections.length > 0 ||
      (item.key === 'contact' && input.hasContactDetails) ||
      (own && !!own.body);
    if (!filled) continue;
    pages.push({
      key: item.key,
      title: input.titleOf
        ? input.titleOf(item.key, own ? own.title : item.title)
        : (own?.title ?? item.title),
      ...(own && { slug: own.slug, body: own.body }),
      sections,
    });
  }
  return pages;
}

// The path of a page under /<slug>, without the language: "" for Home, "/work", "/p/speaking".
export function pagePathOf(page: Pick<PublicPage, 'key' | 'slug'>): string {
  if (isCustomPageKey(page.key)) return `/p/${page.slug ?? ''}`;
  const path = PAGE_PATHS[page.key as PageKey];
  return path ? `/${path}` : '';
}

// Words a section key can be checked against without the config: a built-in or a custom key.
export const isSectionKey = (key: string): key is ConfigKey =>
  (SECTION_KEYS as readonly string[]).includes(key) || isCustomKey(key);

// "Work has only one project, consider the single-page layout": pages that are thin, for the
// dashboard to suggest merging. `counts` is how much content each page holds.
export const THIN_PAGE_AT = 2;
