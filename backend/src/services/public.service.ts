import {
  customIdOf,
  isCustomKey,
  normalizePageConfig,
  normalizeSectionConfig,
  publicLayout,
  readWorkingHours,
  resolvePublicPages,
  type AnyPageKey,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { config } from '../lib/config';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { publishedProfile } from '../lib/profile';
import {
  customItems,
  orderedList,
  publicPostSummarySelect,
  projectList,
  publicProfileSelect,
  publicTestimonials,
} from '../lib/selects';
import { announcementPublicSelect, visibleAnnouncement } from './announcement.service';
import { lookupFor, pick, publishableLocales, type Lookup } from './translation.service';
import { ERRORS } from '../lib/messages';

// Built from an explicit select, so nothing outside this list can reach a visitor. In
// particular the User row is never touched: no account email, passwordHash or userId.
const publicSelect = {
  ...publicProfileSelect,
  id: true,
  sectionConfig: true,
  ...announcementPublicSelect,
  // The pages of multi mode: how they are set up, and the ones the owner made.
  pageConfig: true,
  customPages: {
    select: { id: true, slug: true, title: true, body: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  // Hidden links are filtered in the database. `visible` is dropped since it is always true.
  links: {
    where: { visible: true },
    omit: { profileId: true, visible: true },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
  skills: orderedList,
  experience: orderedList,
  projects: projectList,
  education: orderedList,
  // Whether one is shown is decided by the layout (sectionConfig), not by these rows.
  customSections: {
    select: { id: true, title: true, items: customItems },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
  testimonials: publicTestimonials,
  // The three latest published posts for the section preview. Drafts are filtered in the database,
  // so they cannot reach this response.
  posts: {
    where: { status: 'published' },
    select: publicPostSummarySelect,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: 4, // one more than shown, to know whether there is more
  },
} satisfies Prisma.ProfileSelect;

// An unpublished profile and a profile that does not exist both give the same 404, so
// nobody can tell which slugs are taken by profiles that are not public. The same goes for a
// language that is not offered or whose translation is not ready: it is a 404, not a half page.
export async function languageLookup(
  profile: { id: string; defaultLocale: string; locales: string[] },
  lang: string | undefined,
) {
  const enabled = await publishableLocales(profile.id, profile.locales);
  if (!lang || lang === profile.defaultLocale)
    return { enabled, locale: profile.defaultLocale, lookup: null };
  if (!enabled.includes(lang)) throw AppError.notFound(ERRORS.profileNotFound);
  return { enabled, locale: lang, lookup: await lookupFor(profile.id, lang) };
}

export async function getPublicProfile(slug: string, lang?: string) {
  const profile = await publishedProfile(slug, publicSelect);
  const { enabled, locale, lookup } = await languageLookup(profile, lang);
  const t = (type: Parameters<typeof pick>[1], id: string, field: string, original: string) =>
    lookup ? pick(lookup, type, id, field, original) : original;
  const tn = (
    type: Parameters<typeof pick>[1],
    id: string,
    field: string,
    original: string | null,
  ) => (lookup ? pick(lookup, type, id, field, original) : original);

  // `sections` lists what is shown, in order. The content of a hidden section is left out too:
  // hiding is about privacy as much as layout, and the JSON is as public as the page. Custom
  // sections come back in layout order, visible ones that have items only.
  const {
    sectionConfig,
    pageConfig,
    customPages: ownPages,
    customSections: own,
    posts,
    id,
    ...rest
  } = profile;
  const layout = normalizeSectionConfig(
    sectionConfig,
    own.map((section) => section.id),
  );
  const { sections, customSections } = publicLayout(layout, own);
  const has = (key: string) => sections.some((section) => section.key === key);
  const pages = publicPages();
  // The pages of multi mode that exist for a visitor (none in single mode): shown by the owner, and
  // with something on them. The owner's names for them, and the texts of the pages they made, are in the
  // language asked for.
  function publicPages() {
    if (rest.layoutMode !== 'multi') return [];
    const custom = ownPages.map((page) => ({
      ...page,
      title: t('customPage', page.id, 'title', page.title),
      body: tn('customPage', page.id, 'body', page.body),
    }));
    const contentOf = (key: string) => {
      if (isCustomKey(key)) {
        return own.some((section) => section.id === customIdOf(key) && section.items.length > 0);
      }
      switch (key) {
        case 'about':
          return !!rest.about;
        case 'skills':
          return rest.skills.length > 0;
        case 'experience':
          return rest.experience.length > 0;
        case 'projects':
          return rest.projects.length > 0;
        case 'education':
          return rest.education.length > 0;
        case 'testimonials':
          return rest.testimonials.length > 0 || rest.acceptTestimonials;
        case 'writing':
          return posts.length > 0;
        case 'contact':
          return rest.contactFormEnabled && !rest.isSample;
        default:
          return false;
      }
    };
    return resolvePublicPages({
      config: normalizePageConfig(
        pageConfig,
        ownPages.map((page) => page.id),
        layout.map((item) => item.key),
      ),
      customPages: custom,
      visibleSections: sections.map((section) => section.key),
      hasContent: contentOf,
      hasContactDetails:
        rest.links.length > 0 ||
        (rest.contactFormEnabled && !rest.isSample) ||
        (rest.workCardEnabled && !!rest.timezone),
      titleOf: (key: AnyPageKey, fallback) =>
        key.startsWith('page:')
          ? fallback
          : (tn('page', key, 'title', fallback ?? null) ?? undefined),
    });
  }
  // The announcement is worked out from its stored columns, which never go out as they are.
  const {
    announcementEnabled,
    announcementText,
    announcementLinkUrl,
    announcementLinkLabel,
    announcementStyle,
    announcementStartsAt,
    announcementEndsAt,
    announcementDismissible,
    announcementScroll,
    announcementVersion,
    ...withoutAnnouncement
  } = rest;
  const announcement = visibleAnnouncement(
    {
      id,
      isSample: rest.isSample,
      announcementEnabled,
      announcementText,
      announcementLinkUrl,
      announcementLinkLabel,
      announcementStyle,
      announcementStartsAt,
      announcementEndsAt,
      announcementDismissible,
      announcementScroll,
      announcementVersion,
    },
    lookup,
  );
  // The badge is only part of the page while it is switched on.
  const { availabilityEnabled, availabilityStatus, availabilityMessage, ...withoutBadge } =
    withoutAnnouncement;
  // Likewise the "Working together" card: nothing of it is public while it is switched off.
  const {
    workCardEnabled,
    timezone,
    workingHours,
    replyTime,
    preferredContact,
    workNote,
    contactFormEnabled,
    contactFormIntro,
    ...visible
  } = withoutBadge;
  return {
    ...visible,
    pages,
    ...(announcement && { announcement }),
    // The contact form: nothing of it is public while it is switched off, and a sample has none.
    ...(contactFormEnabled &&
      !rest.isSample && {
        contactForm: {
          intro: tn('profile', id, 'contactFormIntro', contactFormIntro),
          retentionDays: config.CONTACT_RETENTION_DAYS,
        },
      }),
    ...(availabilityEnabled && {
      availabilityEnabled,
      availabilityStatus,
      availabilityMessage: tn('profile', id, 'availabilityMessage', availabilityMessage),
    }),
    ...(workCardEnabled && {
      workCardEnabled,
      timezone,
      workingHours: readWorkingHours(workingHours),
      replyTime,
      preferredContact,
      workNote: tn('profile', id, 'workNote', workNote),
    }),
    // Only the languages a visitor can actually open.
    locales: enabled,
    locale,
    tagline: tn('profile', id, 'tagline', rest.tagline),
    shareMessage: tn('profile', id, 'shareMessage', rest.shareMessage),
    about: has('about') ? tn('profile', id, 'about', rest.about) : null,
    skills: has('skills')
      ? rest.skills.map((row) => ({ ...row, name: t('skill', row.id, 'name', row.name) }))
      : [],
    experience: has('experience')
      ? rest.experience.map((row) => ({
          ...row,
          title: t('experience', row.id, 'title', row.title),
          description: t('experience', row.id, 'description', row.description),
        }))
      : [],
    projects: has('projects')
      ? rest.projects.map((row) => ({
          ...row,
          name: t('project', row.id, 'name', row.name),
          description: t('project', row.id, 'description', row.description),
          coverAlt: tn('project', row.id, 'coverAlt', row.coverAlt),
          images: row.images.map((image) => ({
            ...image,
            alt: tn('projectImage', image.id, 'alt', image.alt),
          })),
        }))
      : [],
    education: has('education')
      ? rest.education.map((row) => ({
          ...row,
          degree: t('education', row.id, 'degree', row.degree),
        }))
      : [],
    testimonials: has('testimonials') ? rest.testimonials : [],
    // Hidden means hidden: no posts either, however many are published.
    writing: has('writing') ? posts.slice(0, 3).map((post) => translatedPost(lookup, post)) : [],
    writingMore: has('writing') && posts.length > 3,
    sections: sections.map((section) =>
      section.title
        ? { ...section, title: t('section', section.key, 'title', section.title) }
        : section,
    ),
    customSections: customSections.map((section) => ({
      ...section,
      title: t('customSection', section.id, 'title', section.title),
      items: section.items.map((item) => ({
        ...item,
        title: t('customItem', item.id, 'title', item.title),
        subtitle: tn('customItem', item.id, 'subtitle', item.subtitle),
        description: tn('customItem', item.id, 'description', item.description),
      })),
    })),
  };
}

function translatedPost<T extends { id: string; title: string; excerpt: string | null }>(
  lookup: Lookup | null,
  post: T,
): T {
  if (!lookup) return post;
  return {
    ...post,
    title: pick(lookup, 'post', post.id, 'title', post.title),
    excerpt: pick(lookup, 'post', post.id, 'excerpt', post.excerpt),
  };
}

// ---- the Writing pages: the full list, and one post

// The published profile whose Writing section is switched on, with the language the visitor asked for.
// Anything else (no such profile, unpublished, the section hidden, a language that is not offered) is
// the same 404, so nothing is revealed.
async function writingContext(slug: string, lang?: string) {
  const profile = await publishedProfile(slug, {
    id: true,
    defaultLocale: true,
    locales: true,
    sectionConfig: true,
    layoutMode: true,
    pageConfig: true,
    customSections: { select: { id: true } },
    customPages: { select: { id: true } },
  });
  const layout = normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  );
  if (!layout.some((item) => item.key === 'writing' && item.visible)) {
    throw AppError.notFound(ERRORS.profileNotFound);
  }
  // In multi mode the list of posts is a page like the others: hidden, it is a 404.
  if (
    profile.layoutMode === 'multi' &&
    !normalizePageConfig(
      profile.pageConfig,
      profile.customPages.map((page) => page.id),
      layout.map((item) => item.key),
    ).some((page) => page.key === 'writing' && page.visible)
  ) {
    throw AppError.notFound(ERRORS.profileNotFound);
  }
  const { lookup } = await languageLookup(profile, lang);
  return { profileId: profile.id, lookup };
}

// Published posts only, newest first. The body is left out: the list shows excerpts.
export async function getPublicPosts(slug: string, lang?: string) {
  const { profileId, lookup } = await writingContext(slug, lang);
  const posts = await prisma.post.findMany({
    where: { profileId, status: 'published' },
    select: publicPostSummarySelect,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
  });
  return posts.map((post) => translatedPost(lookup, post));
}

export async function getPublicPost(slug: string, postSlug: string, lang?: string) {
  const { profileId, lookup } = await writingContext(slug, lang);
  const post = await prisma.post.findFirst({
    where: { profileId, slug: postSlug, status: 'published' },
    select: { ...publicPostSummarySelect, body: true, updatedAt: true },
  });
  if (!post) throw AppError.notFound(ERRORS.postNotFound);
  const translated = translatedPost(lookup, post);
  return lookup
    ? { ...translated, body: pick(lookup, 'post', post.id, 'body', post.body) }
    : translated;
}

// Published profiles that offer other languages, and which ones are ready, for the sitemap.
export async function getLocalesForSitemap() {
  const profiles = await prisma.profile.findMany({
    where: { published: true, locales: { isEmpty: false } },
    select: { id: true, slug: true, locales: true },
    take: 500,
  });
  const rows = await Promise.all(
    profiles.map(async (profile) => ({
      username: profile.slug,
      locales: await publishableLocales(profile.id, profile.locales),
    })),
  );
  return rows.filter((row) => row.locales.length > 0);
}

// Every published post that has a page of its own (not links to articles elsewhere), for the sitemap.
// Only profiles that are published and have the Writing section switched on. Capped, newest first.
const SITEMAP_LIMIT = 5000;

export async function getPostsForSitemap() {
  const rows = await prisma.post.findMany({
    where: { status: 'published', type: 'post', profile: { published: true } },
    select: {
      slug: true,
      updatedAt: true,
      profile: {
        select: { slug: true, sectionConfig: true, customSections: { select: { id: true } } },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: SITEMAP_LIMIT,
  });
  return rows
    .filter(({ profile }) =>
      normalizeSectionConfig(
        profile.sectionConfig,
        profile.customSections.map((section) => section.id),
      ).some((item) => item.key === 'writing' && item.visible),
    )
    .map((row) => ({ username: row.profile.slug, postSlug: row.slug, updatedAt: row.updatedAt }));
}

// The profiles that asked to be listed (Profile.sitemapListed) with the pages and projects a crawler may
// visit, for the sitemap. Each has the pages of its default language; the languages come from
// /public/_locales. Single mode lists only the profile itself. Capped, and read a few at a time.
export async function getPagesForSitemap() {
  const listed = await prisma.profile.findMany({
    where: { published: true, sitemapListed: true, isSample: false },
    select: { slug: true },
    orderBy: { id: 'asc' },
    take: 500,
  });
  const rows: { username: string; paths: string[]; projects: string[] }[] = [];
  for (let at = 0; at < listed.length; at += 20) {
    const batch = await Promise.all(
      listed.slice(at, at + 20).map(async ({ slug }) => {
        const profile = await getPublicProfile(slug);
        const paths =
          profile.layoutMode === 'multi'
            ? profile.pages.map((page) =>
                page.key === 'home'
                  ? ''
                  : page.slug !== undefined
                    ? `/p/${page.slug}`
                    : `/${page.key}`,
              )
            : [''];
        return { username: slug, paths, projects: profile.projects.map((project) => project.slug) };
      }),
    );
    rows.push(...batch);
  }
  return rows;
}
