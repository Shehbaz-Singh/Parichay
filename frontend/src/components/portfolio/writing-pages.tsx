import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '@/components/ShareButton';
import { Avatar, NewTabLink, WritingList } from '@/components/themes/parts';
import { writingEntries } from '@/components/themes/blocks';
import { WritingShell } from '@/components/writing/WritingShell';
import { getPublicPost, getPublicPosts, getPublicProfile } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { formatDate, initials, safeHttpUrl, truncate } from '@/lib/format';
import { fill, pagePath, uiFor } from '@/lib/i18n';
import { alternateLanguages, languageLinks } from '@/lib/portfolio-links';
import { findPage, isMulti, pageLabel } from '@/lib/pages';
import { LocaleScope } from './LocaleScope';
import { breadcrumbList } from './structured-data';

// The Writing pages, in the profile's default language (/<slug>/writing) or another one
// (/<slug>/<locale>/writing).

// About 200 words a minute, and never less than one.
const readingMinutes = (text: string) =>
  Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));

// ---- the list

// The page's name: the owner's own in a multi-page portfolio, else the default for the language.
const listTitle = (profile: NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>) => {
  const page = findPage(profile, 'writing');
  return page ? pageLabel(profile, page) : uiFor(profile.locale).writing.title;
};

export async function writingListMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await getPublicProfile(username, locale);
  if (!profile) notFound();
  const ui = uiFor(profile.locale);
  const title = `${listTitle(profile)} | ${profile.fullName}`;
  const base = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  return {
    title: { absolute: title },
    description: fill(ui.writing.intro, { name: profile.fullName }),
    alternates: {
      canonical: `${base}/writing`,
      ...(profile.locales.length > 0 && { languages: alternateLanguages(profile, '/writing') }),
    },
  };
}

// Every published post, newest first. Not found when the profile is unpublished or the owner has
// the Writing section switched off: hidden means hidden here too.
export async function WritingListView({ username, locale }: { username: string; locale?: string }) {
  const [profile, posts] = await Promise.all([
    getPublicProfile(username, locale),
    getPublicPosts(username, locale),
  ]);
  if (!profile || !posts) notFound();
  const base = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const asked = locale ? `/${username}/${locale}` : `/${username}`;
  if (asked !== base) permanentRedirect(`${base}/writing`);

  const ui = uiFor(profile.locale);
  const entries = writingEntries(profile.slug, posts, base);
  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile, '/writing')}
      label={ui.switcher.label}
      bare={isMulti(profile)}
    >
      <WritingShell
        profile={profile}
        current="writing"
        languages={languageLinks(profile, '/writing')}
      >
        <h1 className="wr-display type-page">{listTitle(profile)}</h1>
        <p className="mt-1 text-muted">{fill(ui.writing.intro, { name: profile.fullName })}</p>
        <div className="mt-10">
          {entries.length > 0 ? (
            <WritingList
              block={{
                kind: 'writing',
                id: 'writing',
                locale: profile.locale,
                ui,
                title: ui.writing.title,
                more: false,
                allHref: `${base}/writing`,
                posts: entries,
              }}
              className="space-y-10"
              itemClassName="group relative min-w-0"
              coverClassName="mb-4 aspect-[40/21] w-full rounded-card object-cover"
              titleClassName="wr-display text-xl leading-snug font-semibold [overflow-wrap:anywhere] sm:text-2xl"
              linkClassName="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg group-hover:underline"
              metaClassName="mt-1 text-sm text-muted"
              excerptClassName="mt-2 leading-relaxed text-muted"
            />
          ) : (
            <p className="text-muted">{ui.writing.nothing}</p>
          )}
        </div>
      </WritingShell>
    </LocaleScope>
  );
}

// ---- one post

export async function postMetadata(
  username: string,
  postSlug: string,
  locale?: string,
): Promise<Metadata> {
  const [profile, post] = await Promise.all([
    getPublicProfile(username, locale),
    getPublicPost(username, postSlug, locale),
  ]);
  if (!profile || !post) notFound();
  const title = `${post.title} | ${profile.fullName}`;
  const description = truncate(post.excerpt ?? post.body ?? post.title, 160);
  const url = `${pagePath(profile.slug, profile.locale, profile.defaultLocale)}/writing/${post.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      ...(profile.locales.length > 0 && {
        languages: alternateLanguages(profile, `/writing/${post.slug}`),
      }),
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      locale: profile.locale,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [profile.fullName],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// One published post. A draft, a missing post and a hidden Writing section all give the same 404.
export async function PostView({
  username,
  postSlug,
  locale,
}: {
  username: string;
  postSlug: string;
  locale?: string;
}) {
  const [profile, post] = await Promise.all([
    getPublicProfile(username, locale),
    getPublicPost(username, postSlug, locale),
  ]);
  if (!profile || !post) notFound();
  const base = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const asked = locale ? `/${username}/${locale}` : `/${username}`;
  if (asked !== base) permanentRedirect(`${base}/writing/${post.slug}`);

  const ui = uiFor(profile.locale);
  const cover = safeHttpUrl(post.coverImageUrl);
  const external = safeHttpUrl(post.externalUrl);
  const hasBody = post.type === 'post' && !!post.body;
  const url = `${SITE_URL}${base}/writing/${post.slug}`;

  // Article structured data. The text comes from the owner, so "<" is escaped: nothing in it can end
  // the script element.
  const structuredData = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      inLanguage: profile.locale,
      headline: post.title,
      description: post.excerpt ?? undefined,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      mainEntityOfPage: url,
      image: cover ? [cover] : undefined,
      author: { '@type': 'Person', name: profile.fullName, url: `${SITE_URL}${base}` },
    },
    breadcrumbList([
      { name: ui.pages.home, path: base },
      { name: ui.writing.title, path: `${base}/writing` },
      { name: post.title, path: `${base}/writing/${post.slug}` },
    ]),
  ]).replace(/</g, '\\u003c');

  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile, `/writing/${post.slug}`)}
      label={ui.switcher.label}
      bare={isMulti(profile)}
    >
      <WritingShell
        profile={profile}
        current="writing"
        languages={languageLinks(profile, `/writing/${post.slug}`)}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        <Link
          href={`${base}/writing`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {ui.writing.back}
        </Link>
        <article className="mt-6">
          <h1 className="wr-display type-page text-balance [overflow-wrap:anywhere]">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <Link
              href={base}
              className="flex min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg"
            >
              <Avatar
                avatar={{
                  src: safeHttpUrl(profile.avatarUrl),
                  alt: '', // the name beside it says whose it is
                  initials: initials(profile.fullName),
                }}
                className="size-10 shrink-0 rounded-full"
                placeholderClassName="bg-accent-soft text-sm font-semibold text-accent-fg"
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold hover:underline">
                  {profile.fullName}
                </span>
                <span className="block text-sm text-muted">
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt, profile.locale)}
                  </time>
                  {hasBody && ` · ${fill(ui.minRead, { count: readingMinutes(post.body ?? '') })}`}
                </span>
              </span>
            </Link>
            <ShareButton
              url={url}
              title={post.title}
              message={`${post.title}: {url}`}
              variant="outline"
              ui={ui.share}
              newTab={ui.newTab}
            />
          </div>
          {cover && (
            // A plain <img>: covers come from Cloudinary, already cropped to 1200 x 630. Decorative.
            <img
              src={cover}
              alt=""
              width={1200}
              height={630}
              decoding="async"
              className="mt-8 aspect-[40/21] w-full rounded-card object-cover"
            />
          )}
          {hasBody ? (
            // 65 characters or so a line is where reading is comfortable.
            <div className="mt-8 max-w-[68ch] text-lg leading-8">
              <Markdown>{post.body ?? ''}</Markdown>
            </div>
          ) : (
            <div className="mt-8 max-w-[68ch] space-y-4">
              {post.excerpt && <p className="text-lg leading-relaxed">{post.excerpt}</p>}
              {external && (
                <NewTabLink
                  href={external}
                  className="inline-flex items-center gap-2 font-semibold text-accent-fg underline underline-offset-2 hover:no-underline"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  {ui.writing.read}
                </NewTabLink>
              )}
            </div>
          )}
        </article>
      </WritingShell>
    </LocaleScope>
  );
}
