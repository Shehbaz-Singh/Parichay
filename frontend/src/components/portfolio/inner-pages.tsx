import type { Metadata, Viewport } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { contactFormInfoSchema, isLocaleCode, type PublicPage } from '@parichay/shared';
import { buildContactForm } from '@/components/themes/blocks';
import {
  ContactForm,
  type ContactPageState,
  type ContactStatus,
} from '@/components/themes/ContactForm';
import { WritingShell } from '@/components/writing/WritingShell';
import { getPublicProfile } from '@/lib/api';
import { API_URL, PROXY_SECRET } from '@/lib/config';
import { fill, pagePath, uiFor } from '@/lib/i18n';
import { truncate } from '@/lib/format';
import { alternateLanguages, languageLinks } from '@/lib/portfolio-links';
import { findCustomPage, findPage, isMulti, pageLabel } from '@/lib/pages';
import { loadTheme } from '@/lib/theme-loader';
import { getTheme } from '@/lib/themes';
import { SampleBanner } from '../SampleBanner';
import { LocaleScope } from './LocaleScope';
import { SiteNav } from './SiteNav';
import { projectTrail } from './page-leads';
import { JsonLd, absolute, breadcrumbList, personData } from './structured-data';

// The pages of a portfolio, other than the Home page (profile-page.tsx): Work, About, Contact, the
// pages the owner made, and a page for each project. In multi mode they are drawn by the owner's own
// theme, which holds the sections the owner put on each page and the navigation; in single mode
// /work and /about hand over to the section on the one page (a temporary redirect: the owner can switch
// back, and a permanent one would stay in browsers), and /p/... does not exist. A project page exists
// in both modes. The route files only pass the language. Each page is in the profile's default language
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

// The browser's own chrome follows the profile's theme, on every page.
export async function pageViewport(username: string, locale?: string): Promise<Viewport> {
  const profile = await getPublicProfile(username, locale);
  if (!profile) return {};
  const { scheme, background } = getTheme(profile.theme);
  return { colorScheme: scheme, themeColor: background };
}

function metadataFor(
  profile: Profile,
  title: string,
  description: string,
  rest: string,
  options: { image?: boolean; index?: boolean } = {},
): Metadata {
  const base = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const url = `${base}${rest}`;
  const full = `${title} | ${profile.fullName}`;
  const text = truncate(description, 160);
  // A page without a card of its own shows the profile's (the segment's file metadata would otherwise
  // be replaced by the openGraph object below).
  const images = options.image === false ? undefined : [{ url: `${base}/opengraph-image` }];
  return {
    title: { absolute: full },
    description: text,
    alternates: {
      canonical: url,
      ...(profile.locales.length > 0 && { languages: alternateLanguages(profile, rest) }),
    },
    openGraph: {
      title: full,
      description: text,
      url,
      locale: profile.locale,
      ...(images && { images }),
    },
    twitter: { card: 'summary_large_image', title: full, description: text },
    ...(options.index === false && { robots: { index: false, follow: false } }),
  };
}

// The page itself: the language strip, the theme with the navigation, and nothing else.
async function ThemedPage({
  profile,
  rest,
  page,
  current,
  heading,
  project,
  contact,
  jsonLd,
}: {
  profile: Profile;
  rest: string;
  page?: PublicPage;
  current: string;
  heading?: string;
  project?: Profile['projects'][number];
  contact?: ContactPageState | null;
  jsonLd?: object | object[];
}) {
  const Theme = await loadTheme(getTheme(profile.theme).key);
  const ui = uiFor(profile.locale);
  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile, rest)}
      label={ui.switcher.label}
      bare={isMulti(profile)}
    >
      {jsonLd && <JsonLd data={jsonLd} />}
      {profile.isSample && <SampleBanner ui={ui.sample} />}
      <Theme
        profile={profile}
        page={page}
        heading={heading}
        project={project}
        contact={contact}
        nav={
          <SiteNav profile={profile} current={current} languages={languageLinks(profile, rest)} />
        }
      />
    </LocaleScope>
  );
}

// In multi mode a page that is hidden, or has nothing on it, does not exist.
function pageOrNotFound(profile: Profile, key: string) {
  const page = findPage(profile, key);
  if (!page) notFound();
  return page;
}

// ---- /work

export async function workMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await load(username, locale);
  const page = isMulti(profile) ? pageOrNotFound(profile, 'work') : null;
  const title = page ? pageLabel(profile, page) : uiFor(profile.locale).sections.projects;
  return metadataFor(profile, title, profile.tagline ?? profile.fullName, '/work');
}

export async function WorkView({ username, locale }: { username: string; locale?: string }) {
  const profile = await load(username, locale);
  const base = canonical(profile, username, locale, '/work');
  // A single page has no work page: its projects are on the page itself.
  if (!isMulti(profile)) redirect(`${base}#projects`);
  const page = pageOrNotFound(profile, 'work');
  return (
    <ThemedPage
      profile={profile}
      rest="/work"
      page={page}
      current="work"
      heading={`${pageLabel(profile, page)} | ${profile.fullName}`}
    />
  );
}

// ---- /work/<slug> (both modes)

function findProject(profile: Profile, projectSlug: string) {
  const project = profile.projects.find((item) => item.slug === projectSlug);
  // Hidden means hidden here too, the way the Writing pages treat a switched-off section.
  if (!project || !profile.sections.some((section) => section.key === 'projects')) notFound();
  return project;
}

export async function projectMetadata(
  username: string,
  projectSlug: string,
  locale?: string,
): Promise<Metadata> {
  const profile = await load(username, locale);
  const project = findProject(profile, projectSlug);
  // The card of its own (opengraph-image.tsx next to the route) is the project's cover, or a title card.
  return metadataFor(
    profile,
    project.name,
    project.description || project.name,
    `/work/${project.slug}`,
    {
      image: false,
    },
  );
}

// Code hosting sites: a project that lives there is source code, and says so to search engines.
const CODE_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org'];

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
  const project = findProject(profile, projectSlug);
  const rest = `/work/${project.slug}`;
  const base = canonical(profile, username, locale, rest);
  const trail = projectTrail(profile, project);

  let host: string;
  try {
    host = project.url ? new URL(project.url).hostname.replace(/^www\./, '') : '';
  } catch {
    host = '';
  }
  const isCode = CODE_HOSTS.includes(host);
  const author = { '@type': 'Person', name: profile.fullName, url: absolute(base) };
  const work = {
    '@context': 'https://schema.org',
    '@type': isCode ? 'SoftwareSourceCode' : 'CreativeWork',
    inLanguage: profile.locale,
    name: project.name,
    description: project.description || undefined,
    url: absolute(`${base}${rest}`),
    image: project.coverUrl ?? undefined,
    keywords: project.techTags.length > 0 ? project.techTags.join(', ') : undefined,
    author,
    ...(isCode && project.url && { codeRepository: project.url }),
  };
  const crumbs = breadcrumbList(
    trail.crumbs.map((crumb) => ({
      name: crumb.label,
      path: crumb.href?.split('#')[0] ?? `${base}${rest}`,
    })),
  );

  return (
    <ThemedPage
      profile={profile}
      rest={rest}
      // The theme's project template is the whole page.
      project={project}
      current="work"
      jsonLd={[work, crumbs]}
    />
  );
}

// ---- /about

export async function aboutMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await load(username, locale);
  const page = isMulti(profile) ? pageOrNotFound(profile, 'about') : null;
  const title = page ? pageLabel(profile, page) : uiFor(profile.locale).sections.about;
  return metadataFor(
    profile,
    title,
    profile.about ?? profile.tagline ?? profile.fullName,
    '/about',
  );
}

export async function AboutView({ username, locale }: { username: string; locale?: string }) {
  const profile = await load(username, locale);
  const base = canonical(profile, username, locale, '/about');
  if (!isMulti(profile)) redirect(`${base}#about`);
  const page = pageOrNotFound(profile, 'about');
  return (
    <ThemedPage
      profile={profile}
      rest="/about"
      page={page}
      current="about"
      heading={`${pageLabel(profile, page)} | ${profile.fullName}`}
      jsonLd={personData(profile, `${base}/about`)}
    />
  );
}

// ---- /p/<slug>: a page the owner made (multi mode only)

export async function customPageMetadata(
  username: string,
  slug: string,
  locale?: string,
): Promise<Metadata> {
  const profile = await load(username, locale);
  const page = isMulti(profile) ? findCustomPage(profile, slug) : null;
  if (!page) notFound();
  const text = (page.body ?? '')
    .replace(/[#*_>`~[\]()-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return metadataFor(
    profile,
    pageLabel(profile, page),
    text || profile.tagline || profile.fullName,
    `/p/${slug}`,
  );
}

export async function CustomPageView({
  username,
  slug,
  locale,
}: {
  username: string;
  slug: string;
  locale?: string;
}) {
  const profile = await load(username, locale);
  const page = isMulti(profile) ? findCustomPage(profile, slug) : null;
  if (!page) notFound();
  canonical(profile, username, locale, `/p/${slug}`);
  return <ThemedPage profile={profile} rest={`/p/${slug}`} page={page} current={page.key} />;
}

// ---- /contact

// The form's own page is never cached: the form carries a signed time stamp that must be fresh. The
// portfolio pages themselves stay cached; only this one is rendered for each request (it reads the
// query, which a form post without JavaScript comes back with).
export interface ContactQuery {
  lang?: string;
  sent?: string;
  error?: string;
}

const STATUSES: ContactStatus[] = ['invalid', 'expired', 'busy', 'captcha', 'failed'];
const langOf = (lang: string | undefined) => (lang && isLocaleCode(lang) ? lang : undefined);

// The query's outcome, as the form shows it, and the same as a query string.
const statusOf = (query: ContactQuery): ContactStatus | undefined =>
  query.sent === '1' ? 'sent' : STATUSES.find((value) => value === query.error);
const statusQuery = (query: ContactQuery) => {
  const out = new URLSearchParams();
  if (query.sent === '1') out.set('sent', '1');
  else if (STATUSES.some((value) => value === query.error)) out.set('error', query.error ?? '');
  const text = out.toString();
  return text ? `?${text}` : '';
};

async function loadFormInfo(slug: string) {
  const headers = new Headers();
  if (PROXY_SECRET) headers.set('x-proxy-secret', PROXY_SECRET);
  const res = await fetch(`${API_URL}/public/${encodeURIComponent(slug)}/contact`, {
    cache: 'no-store',
    headers,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Contact form API responded with ${res.status}`);
  return contactFormInfoSchema.parse(await res.json());
}

export async function contactMetadata(
  username: string,
  locale: string | undefined,
  query: ContactQuery,
): Promise<Metadata> {
  const profile = await load(username, locale ?? langOf(query.lang));
  if (isMulti(profile)) {
    const page = pageOrNotFound(profile, 'contact');
    // What a post without JavaScript comes back to is not a page to find.
    return metadataFor(
      profile,
      pageLabel(profile, page),
      profile.tagline ?? profile.fullName,
      '/contact',
      {
        index: !statusOf(query),
      },
    );
  }
  if (!profile.contactForm) notFound();
  return {
    title: {
      absolute: fill(uiFor(profile.locale).contactForm.pageTitle, { name: profile.fullName }),
    },
    robots: { index: false, follow: false },
  };
}

export async function ContactView({
  username,
  locale,
  query,
}: {
  username: string;
  locale?: string;
  query: ContactQuery;
}) {
  const asked = locale ?? langOf(query.lang);
  const profile = await load(username, asked);
  const ui = uiFor(profile.locale);
  const status = statusOf(query);

  if (isMulti(profile)) {
    // The form posts back to /contact?lang=xx; a language has its own address, so go there.
    if (!locale && asked && asked !== profile.defaultLocale) {
      redirect(`/${username}/${asked}/contact${statusQuery(query)}`);
    }
    canonical(profile, username, locale, '/contact');
    const page = pageOrNotFound(profile, 'contact');
    const info = profile.contactForm ? await loadFormInfo(profile.slug) : null;
    return (
      <ThemedPage
        profile={profile}
        rest="/contact"
        page={page}
        current="contact"
        // The form is open from the start, with the signed time stamp of this request.
        contact={
          info ? { token: info.token, captchaKey: info.captcha?.siteKey ?? null, status } : null
        }
        jsonLd={personData(
          profile,
          `${pagePath(profile.slug, profile.locale, profile.defaultLocale)}/contact`,
        )}
      />
    );
  }

  // A single page: the form's own page, for the "Send a message" link without JavaScript.
  if (!profile.contactForm) notFound();
  const info = await loadFormInfo(profile.slug);
  if (!info) notFound();
  const form = buildContactForm(
    profile,
    profile.contactForm.intro,
    profile.contactForm.retentionDays,
  );
  return (
    <LocaleScope locale={profile.locale} links={[]} label={ui.switcher.label}>
      <WritingShell profile={profile} allPosts={false}>
        <h1 className="wr-display type-page">
          {fill(ui.contactForm.pageTitle, { name: profile.fullName })}
        </h1>
        <div className="mt-6">
          <ContactForm
            form={form}
            page={{ token: info.token, captchaKey: info.captcha?.siteKey ?? null, status }}
          />
        </div>
      </WritingShell>
    </LocaleScope>
  );
}
