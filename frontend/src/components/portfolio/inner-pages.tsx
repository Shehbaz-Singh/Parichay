import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { buildBlocks, pageSplit, type ThemeView } from '@/components/themes/blocks';
import { getPublicProfile } from '@/lib/api';
import { truncate } from '@/lib/format';
import { pagePath, uiFor } from '@/lib/i18n';
import { alternateLanguages, languageLinks } from '@/lib/portfolio-links';
import { loadTheme } from '@/lib/theme-loader';
import { getTheme } from '@/lib/themes';
import { SampleBanner } from '../SampleBanner';
import { LocaleScope } from './LocaleScope';
import { SiteNav, type NavPage } from './SiteNav';

// The pages of a portfolio that is split because it has a lot on it (see pageSplit): /work, a page
// for each project, and /about. They are drawn by the owner's own theme, the same sections as on the
// single page but without the big header, so each keeps its character. The route files only pass the
// language, as for the profile page itself. Each page is in the profile's default language
// (/<slug>/work) or another (/<slug>/<locale>/work).

type Profile = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>;

// One canonical address per page (the default language has no /en), as for the profile page.
function canonical(profile: Profile, username: string, locale: string | undefined, rest: string) {
  const base = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const asked = locale ? `/${username}/${locale}` : `/${username}`;
  if (asked !== base) permanentRedirect(`${base}${rest}`);
  return base;
}

async function load(username: string, locale?: string) {
  const profile = await getPublicProfile(username, locale);
  if (!profile) notFound();
  return profile;
}

function metadataFor(profile: Profile, title: string, description: string, rest: string): Metadata {
  const url = `${pagePath(profile.slug, profile.locale, profile.defaultLocale)}${rest}`;
  const full = `${title} | ${profile.fullName}`;
  const text = truncate(description, 160);
  return {
    title: { absolute: full },
    description: text,
    alternates: {
      canonical: url,
      ...(profile.locales.length > 0 && { languages: alternateLanguages(profile, rest) }),
    },
    openGraph: { title: full, description: text, url, locale: profile.locale },
    twitter: { card: 'summary_large_image', title: full, description: text },
  };
}

const shows = (profile: Profile, key: string) => profile.sections.some((s) => s.key === key);

const titleOf = (profile: Profile, key: 'projects' | 'about') =>
  profile.sections.find((s) => s.key === key)?.title ?? uiFor(profile.locale).sections[key];

// The page itself: the language strip, the theme with the navigation, and nothing else.
async function ThemedPage({
  profile,
  rest,
  view,
  current,
  heading,
  projectId,
}: {
  profile: Profile;
  rest: string;
  view: ThemeView;
  current: NavPage;
  heading: string;
  projectId?: string;
}) {
  const Theme = await loadTheme(getTheme(profile.theme).key);
  const ui = uiFor(profile.locale);
  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile, rest)}
      label={ui.switcher.label}
    >
      {profile.isSample && <SampleBanner ui={ui.sample} />}
      <Theme
        profile={profile}
        view={view}
        heading={heading}
        projectId={projectId}
        nav={<SiteNav profile={profile} current={current} always={!!projectId} />}
      />
    </LocaleScope>
  );
}

// ---- /work

export async function workMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await load(username, locale);
  return metadataFor(
    profile,
    titleOf(profile, 'projects'),
    profile.tagline ?? profile.fullName,
    '/work',
  );
}

export async function WorkView({ username, locale }: { username: string; locale?: string }) {
  const profile = await load(username, locale);
  const base = canonical(profile, username, locale, '/work');
  // A profile that is a single page has no work page: its projects are on the page itself.
  if (!pageSplit(profile).work) redirect(base);
  return (
    <ThemedPage
      profile={profile}
      rest="/work"
      view="work"
      current="work"
      heading={`${titleOf(profile, 'projects')} | ${profile.fullName}`}
    />
  );
}

// ---- /work/<slug>

export async function projectMetadata(
  username: string,
  projectSlug: string,
  locale?: string,
): Promise<Metadata> {
  const profile = await load(username, locale);
  const project = profile.projects.find((item) => item.slug === projectSlug);
  if (!project || !shows(profile, 'projects')) notFound();
  return metadataFor(
    profile,
    project.name,
    project.description || project.name,
    `/work/${project.slug}`,
  );
}

export async function ProjectView({
  username,
  projectSlug,
  locale,
}: {
  username: string;
  projectSlug: string;
  locale?: string;
}) {
  const profile = await load(username, locale);
  const project = profile.projects.find((item) => item.slug === projectSlug);
  // Hidden means hidden here too, the way the Writing pages treat a switched-off section.
  if (!project || !shows(profile, 'projects')) notFound();
  canonical(profile, username, locale, `/work/${project.slug}`);
  // The projects block of the work view, narrowed to this project (a project with nothing to draw
  // cannot happen: it has a name).
  if (!buildBlocks(profile, '', 'work', project.id).some((b) => b.kind === 'projects')) notFound();
  return (
    <ThemedPage
      profile={profile}
      rest={`/work/${project.slug}`}
      view="work"
      current="work"
      heading={`${project.name} | ${profile.fullName}`}
      projectId={project.id}
    />
  );
}

// ---- /about

export async function aboutMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await load(username, locale);
  return metadataFor(
    profile,
    titleOf(profile, 'about'),
    profile.about ?? profile.tagline ?? profile.fullName,
    '/about',
  );
}

export async function AboutView({ username, locale }: { username: string; locale?: string }) {
  const profile = await load(username, locale);
  const base = canonical(profile, username, locale, '/about');
  if (!pageSplit(profile).about) redirect(base);
  return (
    <ThemedPage
      profile={profile}
      rest="/about"
      view="about"
      current="about"
      heading={`${titleOf(profile, 'about')} | ${profile.fullName}`}
    />
  );
}
