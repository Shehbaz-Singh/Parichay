import type { Metadata, Viewport } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { SampleBanner } from '@/components/SampleBanner';
import { getPublicProfile } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { truncate } from '@/lib/format';
import { pagePath, uiFor } from '@/lib/i18n';
import { alternateLanguages, languageLinks } from '@/lib/portfolio-links';
import { loadTheme } from '@/lib/theme-loader';
import { getTheme } from '@/lib/themes';
import { LocaleScope } from './LocaleScope';
import { SiteNav } from './SiteNav';
import { pageSplit } from '@/components/themes/blocks';

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
  return { colorScheme: scheme, themeColor: background };
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

  // Structured data in the page's language. The text comes from the owner, so "<" is escaped.
  const sameAs = profile.links
    .filter((link) => /^https?:\/\//i.test(link.url) && link.type !== 'other')
    .map((link) => link.url);
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    inLanguage: profile.locale,
    url: `${SITE_URL}${path}`,
    mainEntity: {
      '@type': 'Person',
      name: profile.fullName,
      jobTitle: profile.tagline ?? undefined,
      description: profile.about ? truncate(profile.about, 300) : undefined,
      url: `${SITE_URL}${path}`,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    },
  }).replace(/</g, '\u003c');

  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile)}
      label={uiFor(profile.locale).switcher.label}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      {profile.isSample && <SampleBanner ui={uiFor(profile.locale).sample} />}
      <Theme
        profile={profile}
        view={pageSplit(profile).split ? 'home' : 'all'}
        nav={<SiteNav profile={profile} current="home" />}
      />
    </LocaleScope>
  );
}
