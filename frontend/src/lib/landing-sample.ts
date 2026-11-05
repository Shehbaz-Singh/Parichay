import {
  SAMPLE_PROFILES,
  customKey,
  type PublicProfile,
  type SampleProfile,
  type ThemeKey,
} from '@parichay/shared';

// The sample profiles (shared/src/samples.ts, the same ones the seed script stores) as the
// public page would receive them, so the landing page can draw them in the real themes without
// waiting for the API. Nothing here is a real person.
const iso = (day: string) => `${day}T00:00:00.000Z`;

function toPublic(sample: SampleProfile): PublicProfile {
  const customSections = sample.custom.map((section, index) => ({
    id: `sample${index}`,
    title: section.title,
    items: section.items.map((item, order) => ({
      id: `sample${index}-${order}`,
      title: item.title,
      subtitle: item.subtitle ?? null,
      startDate: item.start ? iso(item.start) : null,
      endDate: item.end ? iso(item.end) : null,
      url: item.url ?? null,
      description: item.description ?? null,
      order,
    })),
  }));
  const posts = sample.posts
    .map((post, index) => ({
      id: `post${index}`,
      title: post.title,
      slug: post.slug,
      type: post.type,
      excerpt: post.excerpt,
      externalUrl: post.externalUrl ?? null,
      coverImageUrl: null,
      publishedAt: post.publishedAt,
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const shown = (key: string) => sample.sections.includes(key as never);

  return {
    slug: sample.slug,
    fullName: sample.fullName,
    tagline: sample.tagline,
    about: sample.about,
    location: sample.location,
    avatarUrl: null,
    avatarShape: null,
    theme: sample.theme,
    accentColor: sample.accentColor,
    leadWith: 'automatic' as const,
    appearance: 'dark' as const,
    testimonialStyle: 'list' as const,
    isSample: true,
    defaultLocale: 'en',
    locales: [],
    locale: 'en',
    layoutMode: 'single',
    pages: [],
    acceptTestimonials: false,
    resumeEnabled: true,
    contactCardEnabled: false,
    contactCardPhoto: false,
    shareMessage: null,
    ...(sample.availability && {
      availabilityEnabled: true as const,
      availabilityStatus: sample.availability.status,
      availabilityMessage: sample.availability.message,
    }),
    sections: sample.sections.map((entry) =>
      entry.startsWith('custom:')
        ? { key: customKey(`sample${entry.slice('custom:'.length)}`) }
        : { key: entry },
    ),
    // Hidden sections leave their content out, as the API does.
    customSections: customSections.filter((_, index) => shown(`custom:${index}`)),
    testimonials: shown('testimonials')
      ? sample.testimonials.map((item, order) => ({ id: `t${order}`, order, ...item }))
      : [],
    writing: shown('writing') ? posts.slice(0, 3) : [],
    writingMore: shown('writing') && posts.length > 3,
    links: sample.links.map((link, order) => ({ id: `l${order}`, order, ...link })),
    skills: shown('skills')
      ? sample.skills.map((name, order) => ({ id: `s${order}`, name, order }))
      : [],
    experience: shown('experience')
      ? sample.experience.map((job, order) => ({
          id: `e${order}`,
          title: job.title,
          company: job.company,
          startDate: iso(job.start),
          endDate: job.end ? iso(job.end) : null,
          description: job.description,
          order,
        }))
      : [],
    projects: shown('projects')
      ? sample.projects.map((project, order) => ({
          id: `p${order}`,
          order,
          featured: false,
          experienceId: null,
          slug: `p${order}`,
          coverUrl: null,
          coverAlt: null,
          coverWidth: null,
          coverHeight: null,
          images: [],
          ...project,
        }))
      : [],
    education: shown('education')
      ? sample.education.map((item, order) => ({
          id: `d${order}`,
          degree: item.degree,
          institution: item.institution,
          startDate: iso(item.start),
          endDate: item.end ? iso(item.end) : null,
          order,
        }))
      : [],
  };
}

export const SAMPLES: PublicProfile[] = SAMPLE_PROFILES.map(toPublic);

// The sample that shows each theme, one to one.
// Sidebar has no sample of its own (the stored samples are the five above): its preview draws the
// featured sample in it.
export const SAMPLE_BY_THEME = {
  ...Object.fromEntries(SAMPLES.map((profile) => [profile.theme, profile])),
  index: { ...SAMPLES[0], theme: 'index' },
  sidebar: { ...SAMPLES[0], theme: 'sidebar' },
  aurora: { ...SAMPLES[0], theme: 'aurora' },
} as Record<ThemeKey, PublicProfile>;

// "See an example" goes here: the most complete page.
export const FEATURED_SAMPLE_SLUG = SAMPLE_PROFILES[0].slug;
