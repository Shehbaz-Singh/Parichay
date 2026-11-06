import { translationKey, type PublicProfile, type StoredTranslation } from '@parichay/shared';

// The dashboard's live preview in another language. It mirrors the merge the API does for visitors
// (backend/src/services/public.service.ts, getPublicProfile): every translatable text is looked up
// on its own and falls back to the default-language text, so a half-translated page still reads
// fully. A blank translation counts as none.
export function applyTranslations(
  preview: PublicProfile,
  entries: readonly StoredTranslation[],
  locale: string,
): PublicProfile {
  const map = new Map<string, string>();
  for (const entry of entries) {
    if (entry.value.trim())
      map.set(translationKey(entry.entityType, entry.entityId, entry.field), entry.value);
  }
  const get = (type: StoredTranslation['entityType'], id: string, field: string) =>
    map.get(translationKey(type, id, field));
  // The public profile has no id, and the profile's own texts are stored under it: all of them
  // share one, so it is taken from the entries.
  const profileId = entries.find((entry) => entry.entityType === 'profile')?.entityId ?? '';
  const t = (type: StoredTranslation['entityType'], id: string, field: string, original: string) =>
    get(type, id, field) ?? original;
  // For fields that may be empty: only translate when there is something to translate.
  const tn = <T extends string | null | undefined>(
    type: StoredTranslation['entityType'],
    id: string,
    field: string,
    original: T,
  ): T | string => (original ? t(type, id, field, original) : original);

  return {
    ...preview,
    locale,
    tagline: tn('profile', profileId, 'tagline', preview.tagline),
    about: tn('profile', profileId, 'about', preview.about),
    shareMessage: tn('profile', profileId, 'shareMessage', preview.shareMessage ?? null),
    availabilityMessage: tn(
      'profile',
      profileId,
      'availabilityMessage',
      preview.availabilityMessage,
    ),
    announcement: preview.announcement && {
      ...preview.announcement,
      text: t('profile', profileId, 'announcementText', preview.announcement.text),
      linkLabel: tn('profile', profileId, 'announcementLinkLabel', preview.announcement.linkLabel),
    },
    contactForm: preview.contactForm && {
      ...preview.contactForm,
      intro: tn('profile', profileId, 'contactFormIntro', preview.contactForm.intro),
    },
    workNote: preview.workCardEnabled
      ? tn('profile', profileId, 'workNote', preview.workNote ?? null)
      : undefined,
    skills: preview.skills.map((row) => ({ ...row, name: t('skill', row.id, 'name', row.name) })),
    experience: preview.experience.map((row) => ({
      ...row,
      title: t('experience', row.id, 'title', row.title),
      description: t('experience', row.id, 'description', row.description),
    })),
    projects: preview.projects.map((row) => ({
      ...row,
      name: t('project', row.id, 'name', row.name),
      description: t('project', row.id, 'description', row.description),
      coverAlt: tn('project', row.id, 'coverAlt', row.coverAlt),
      images: row.images.map((image) => ({
        ...image,
        alt: tn('projectImage', image.id, 'alt', image.alt),
      })),
    })),
    // The owner's names for the pages, and the texts of the pages they made.
    pages: preview.pages.map((page) => {
      const own = page.key.startsWith('page:') ? page.key.slice('page:'.length) : null;
      return own
        ? {
            ...page,
            title: t('customPage', own, 'title', page.title ?? ''),
            body: tn('customPage', own, 'body', page.body),
          }
        : page.title
          ? { ...page, title: t('page', page.key, 'title', page.title) }
          : page;
    }),
    education: preview.education.map((row) => ({
      ...row,
      degree: t('education', row.id, 'degree', row.degree),
    })),
    writing: preview.writing.map((post) => ({
      ...post,
      title: t('post', post.id, 'title', post.title),
      excerpt: tn('post', post.id, 'excerpt', post.excerpt),
    })),
    sections: preview.sections.map((section) =>
      section.title
        ? { ...section, title: t('section', section.key, 'title', section.title) }
        : section,
    ),
    customSections: preview.customSections.map((section) => ({
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
