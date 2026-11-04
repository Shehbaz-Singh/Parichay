import type { Metadata, Viewport } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { SampleBanner } from '@/components/SampleBanner';
import { getPublicProfile } from '@/lib/api';
import { truncate } from '@/lib/format';
import { pagePath, uiFor } from '@/lib/i18n';
import { findPage, isMulti, pageHref } from '@/lib/pages';
import { alternateLanguages, languageLinks } from '@/lib/portfolio-links';
import { loadTheme } from '@/lib/theme-loader';
import { getTheme } from '@/lib/themes';
import { LocaleScope } from './LocaleScope';
import { AnchorForward } from './AnchorForward';
import { SiteNav } from './SiteNav';
import { JsonLd, personData } from './structured-data';

// The portfolio page, in the profile's default language (/<slug>) or another one (/<slug>/<locale>).
// The route files only pass the language; everything else is here, so the two cannot drift apart.

export async function profileMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await getPublicProfile(username, locale);
  if (!profile) notFound();

  const title = profile.tagline ? `${profile.fullName} | ${profile.tagline}` : profile.fullName;
  const description = truncate(
    profile.about ??
      profile.tagline ??
      uiFor(profile.locale).shareTitle.replace('{name}', profile.fullName),
    160,
  );
  // Resolved against metadataBase in the root layout.
  const url = pagePath(profile.slug, profile.locale, profile.defaultLocale);

  return {
    title: { absolute: title },
    description,
    // Each language is its own canonical page, and they point at one another.
    alternates: {
      canonical: url,
      ...(profile.locales.length > 0 && { languages: alternateLanguages(profile) }),
    },
    // og:image comes from the opengraph-image.tsx next to the route.
    openGraph: {
      type: 'profile',
      title,
      description,
      url,
      username: profile.slug,
      locale: profile.locale,
      alternateLocale: profile.locales.filter((code) => code !== profile.locale),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// The browser's own chrome follows the profile's theme.
export async function profileViewport(username: string, locale?: string): Promise<Viewport> {
  const profile = await getPublicProfile(username, locale);
  if (!profile) return {};
  const { scheme, background } = getTheme(profile.theme);
  // Aurora's light look has a light page: the browser's own chrome follows it.
  const light = profile.theme === 'aurora' && profile.appearance === 'light';
  return { colorScheme: light ? 'light' : scheme, themeColor: light ? '#faf8f4' : background };
}

export async function ProfileView({ username, locale }: { username: string; locale?: string }) {
  const profile = await getPublicProfile(username, locale);
  if (!profile) notFound();

  // /AYUSH-GILL and /ayush-gill are the same profile, and the default language has one address
  // (/slug, not /slug/en): keep one canonical URL.
  const path = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const asked = locale ? `/${username}/${locale}` : `/${username}`;
  if (asked !== path) permanentRedirect(path);

  const Theme = await loadTheme(getTheme(profile.theme).key);

  // The old single page had a section for everything: a link to /<slug>#projects now goes to the page
  // that has the projects, when this Home page does not have that anchor itself.
  const multi = isMulti(profile);
  const forward: Record<string, string> = {};
  for (const page of profile.pages) {
    if (page.key === 'home') continue;
    for (const key of page.sections) {
      const id = key.startsWith('custom:') ? `custom-${key.slice('custom:'.length)}` : key;
      forward[id] = ['projects', 'writing', 'contact'].includes(key)
        ? pageHref(profile, page)
        : `${pageHref(profile, page)}#${id}`;
    }
  }

  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile)}
      label={uiFor(profile.locale).switcher.label}
      bare={multi || getTheme(profile.theme).key === 'aurora'}
    >
      <JsonLd data={personData(profile, path)} />
      {multi && <AnchorForward targets={forward} />}
      {profile.isSample && <SampleBanner ui={uiFor(profile.locale).sample} />}
      <Theme
        profile={profile}
        page={multi ? findPage(profile, 'home') : undefined}
        nav={<SiteNav profile={profile} current="home" languages={languageLinks(profile)} />}
      />
    </LocaleScope>
  );
}
