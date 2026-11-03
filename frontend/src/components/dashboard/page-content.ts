import {
  customIdOf,
  isCustomKey,
  normalizePageConfig,
  normalizeSectionConfig,
  resolvePublicPages,
  type MyProfile,
  type PublicPage,
} from '@parichay/shared';

// What the pages of a multi-page portfolio hold, worked out from the profile in the editor. The rules
// are the ones the API applies for visitors (backend/src/services/public.service.ts, publicPages), so
// the preview and the Pages screen show the pages that will really exist.

// How many things a section would show: jobs, projects, posts and so on. A text counts as one.
export function sectionCount(profile: MyProfile, key: string): number {
  if (isCustomKey(key)) {
    return profile.customSections.find((s) => s.id === customIdOf(key))?.items.length ?? 0;
  }
  switch (key) {
    case 'about':
      return profile.about?.trim() ? 1 : 0;
    case 'skills':
      return profile.skills.length;
    case 'experience':
      return profile.experience.length;
    case 'projects':
      return profile.projects.length;
    case 'education':
      return profile.education.length;
    case 'testimonials':
      return profile.testimonials.filter((item) => item.status === 'approved').length;
    case 'writing':
      return (profile.posts ?? []).filter((post) => post.status === 'published').length;
    case 'contact':
      return profile.contactFormEnabled && !profile.isSample ? 1 : 0;
    default:
      return 0;
  }
}

// Shown when it has something to draw (a testimonials section that invites them counts, as on the page).
export const sectionHasContent = (profile: MyProfile, key: string) =>
  sectionCount(profile, key) > 0 || (key === 'testimonials' && profile.acceptTestimonials);

// The keys of every section the profile has, hidden ones included: any can be put on a page.
export const allSectionKeys = (profile: MyProfile) =>
  normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  ).map((item) => item.key);

// The page list repaired against what exists, like the API does before it uses it.
export const pageConfigOf = (profile: MyProfile) =>
  normalizePageConfig(
    profile.pageConfig,
    profile.customPages.map((page) => page.id),
    allSectionKeys(profile),
  );

// The pages a visitor would get, in navigation order. Single mode has none.
export function previewPages(profile: MyProfile): PublicPage[] {
  if (profile.layoutMode !== 'multi') return [];
  const visible = normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  )
    .filter((item) => item.visible)
    .map((item) => item.key);
  return resolvePublicPages({
    config: pageConfigOf(profile),
    customPages: profile.customPages,
    visibleSections: visible,
    hasContent: (key) => sectionHasContent(profile, key),
    hasContactDetails:
      profile.links.some((link) => link.visible) ||
      (profile.contactFormEnabled && !profile.isSample) ||
      (profile.workCardEnabled && !!profile.timezone),
  });
}
