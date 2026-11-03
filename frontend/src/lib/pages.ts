import {
  PAGE_KEYS,
  pagePathOf,
  type PageKey,
  type PublicPage,
  type PublicProfile,
} from '@parichay/shared';
import { pagePath, uiFor } from '@/lib/i18n';

// The pages of a multi-page portfolio, as the navigation and the page routes need them. The API
// decides which pages exist (shared/src/pages.ts); this only names and addresses them. A single-page
// profile has none.

export interface NavItem {
  key: string; // "home", "work", ... or "page:<id>"
  href: string; // in the language of the page
  label: string; // the owner's name for it, or the default in the page's language
}

export const isMulti = (profile: Pick<PublicProfile, 'layoutMode'>) =>
  profile.layoutMode === 'multi';

// The page with this key, if it exists for a visitor (hidden and empty pages do not).
export const findPage = (profile: Pick<PublicProfile, 'pages'>, key: string) =>
  profile.pages.find((page) => page.key === key);

// A custom page by its address (/p/<slug>).
export const findCustomPage = (profile: Pick<PublicProfile, 'pages'>, slug: string) =>
  profile.pages.find((page) => page.slug === slug);

export function pageLabel(profile: Pick<PublicProfile, 'locale'>, page: PublicPage): string {
  if (page.title) return page.title;
  const builtIn = (PAGE_KEYS as readonly string[]).includes(page.key);
  return builtIn ? uiFor(profile.locale).pages[page.key as PageKey] : page.key;
}

// The address of a page in the language of the profile object: /slug, /slug/work, /slug/de/p/uses.
export const pageHref = (
  profile: Pick<PublicProfile, 'slug' | 'locale' | 'defaultLocale'>,
  page: Pick<PublicPage, 'key' | 'slug'>,
) => `${pagePath(profile.slug, profile.locale, profile.defaultLocale)}${pagePathOf(page)}`;

// The navigation entries, Home first, in the owner's order.
export function navItems(profile: PublicProfile): NavItem[] {
  return profile.pages.map((page) => ({
    key: page.key,
    href: pageHref(profile, page),
    label: pageLabel(profile, page),
  }));
}
