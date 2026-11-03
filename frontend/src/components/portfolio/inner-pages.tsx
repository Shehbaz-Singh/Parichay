import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LeaveTestimonial } from '@/components/themes/LeaveTestimonial';
import { ReadMore } from '@/components/themes/ReadMore';
import { buildBlocks, pageSplit, type Block } from '@/components/themes/blocks';
import { DateRange, NewTabLink, RoleList, TotalExperience } from '@/components/themes/parts';
import { WritingShell } from '@/components/writing/WritingShell';
import { getPublicProfile } from '@/lib/api';
import { truncate } from '@/lib/format';
import { pagePath, uiFor } from '@/lib/i18n';
import { alternateLanguages, languageLinks } from '@/lib/portfolio-links';
import { LocaleScope } from './LocaleScope';

// The pages of a portfolio that is split because it has a lot on it (see pageSplit): /work, a page
// for each project, and /about. They share the Writing pages' frame (the owner's colors and fonts, a
// slim navigation): quiet, text-led lists. The route files only pass the language, as for the
// profile page itself. Each one is in the profile's default language (/<slug>/work) or another
// (/<slug>/<locale>/work).

const link = 'underline underline-offset-2 hover:no-underline';
const accentLink = `text-accent-fg ${link}`;
const heading = 'wr-display type-page text-balance [overflow-wrap:anywhere]';

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

const projectsOf = (profile: Profile) => {
  const block = buildBlocks(profile, '', 'work').find((b) => b.kind === 'projects');
  return block?.kind === 'projects' ? block : undefined;
};

// ---- /work

export async function workMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await load(username, locale);
  const title = projectsOf(profile)?.title ?? uiFor(profile.locale).sections.projects;
  return metadataFor(profile, title, profile.tagline ?? profile.fullName, '/work');
}

export async function WorkView({ username, locale }: { username: string; locale?: string }) {
  const profile = await load(username, locale);
  const base = canonical(profile, username, locale, '/work');
  const block = projectsOf(profile);
  // A profile that is a single page has no work page: its projects are on the page itself.
  if (!block || !pageSplit(profile).work) redirect(base);

  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile, '/work')}
      label={uiFor(profile.locale).switcher.label}
    >
      <WritingShell profile={profile} current="work">
        <h1 className={heading}>{block.title}</h1>
        <ol className="mt-10 divide-y divide-line border-y border-line">
          {block.projects.map((project) => (
            <li key={project.id} className="py-8">
              <h2 className="wr-display text-xl leading-snug font-semibold [overflow-wrap:anywhere] sm:text-2xl">
                <Link href={`${base}/work/${project.slug}`} className={link}>
                  {project.name}
                </Link>
              </h2>
              {project.tags.length > 0 && (
                <p className="mt-1 text-sm text-muted">{project.tags.join(' · ')}</p>
              )}
              {project.description && (
                <ReadMore
                  text={project.description}
                  locale={profile.locale}
                  lines={5}
                  className="mt-3 max-w-[68ch] leading-relaxed"
                />
              )}
            </li>
          ))}
        </ol>
      </WritingShell>
    </LocaleScope>
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
  const base = canonical(profile, username, locale, `/work/${project.slug}`);
  const ui = uiFor(profile.locale);
  const back = pageSplit(profile).work
    ? { href: `${base}/work`, label: projectsOf(profile)?.title ?? ui.sections.projects }
    : { href: base, label: profile.fullName };
  const url = project.url && /^https?:\/\//i.test(project.url) ? project.url : null;

  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile, `/work/${project.slug}`)}
      label={ui.switcher.label}
    >
      <WritingShell profile={profile} current="work">
        <Link
          href={back.href}
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${accentLink}`}
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {back.label}
        </Link>
        <article className="mt-6">
          <h1 className={heading}>{project.name}</h1>
          {project.techTags.length > 0 && (
            <p className="mt-3 text-muted">{project.techTags.join(' · ')}</p>
          )}
          {project.description && (
            <p className="mt-8 max-w-[68ch] text-lg leading-8 whitespace-pre-line">
              {project.description}
            </p>
          )}
          {url && (
            <p className="mt-8">
              <NewTabLink href={url} className={`font-semibold ${accentLink}`}>
                {url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
              </NewTabLink>
            </p>
          )}
        </article>
      </WritingShell>
    </LocaleScope>
  );
}

// ---- /about

export async function aboutMetadata(username: string, locale?: string): Promise<Metadata> {
  const profile = await load(username, locale);
  const title =
    profile.sections.find((s) => s.key === 'about')?.title ?? uiFor(profile.locale).sections.about;
  return metadataFor(
    profile,
    title,
    profile.about ?? profile.tagline ?? profile.fullName,
    '/about',
  );
}

function AboutBlock({ block, slug }: { block: Block; slug: string }) {
  switch (block.kind) {
    case 'about':
      return <p className="max-w-[68ch] text-lg leading-8 whitespace-pre-line">{block.text}</p>;
    case 'skills':
      return (
        <ul className="flex max-w-[68ch] flex-wrap gap-x-5 gap-y-1 text-lg">
          {block.skills.map((skill) => (
            <li key={skill.id}>{skill.name}</li>
          ))}
        </ul>
      );
    case 'entries':
      return (
        <>
          <TotalExperience
            total={block.total}
            label={block.ui.totalExperience}
            className="mb-4 text-sm text-muted"
          />
          <ol className="divide-y divide-line border-y border-line">
            {block.entries.map((entry) => (
              <li
                key={entry.id}
                className={`py-6 ${entry.start ? 'md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:gap-8' : ''}`}
              >
                {entry.start && (
                  <p className="mb-1 text-sm text-muted tabular-nums md:mt-1 md:mb-0">
                    <DateRange
                      start={entry.start}
                      end={entry.end}
                      openEnded={block.variant !== 'custom'}
                      duration={entry.duration}
                      fmt={entry.fmt}
                    />
                  </p>
                )}
                <div className="min-w-0">
                  <h3 className="wr-display text-lg leading-snug font-semibold [overflow-wrap:anywhere]">
                    {entry.title}
                  </h3>
                  {entry.subtitle && <p className="text-muted">{entry.subtitle}</p>}
                  {entry.roles && (
                    <RoleList
                      roles={entry.roles}
                      className="mt-3 space-y-4 border-s border-line ps-4"
                      titleClassName="font-medium"
                      datesClassName="text-sm text-muted tabular-nums"
                      descriptionClassName="mt-1 max-w-[68ch] leading-relaxed"
                    />
                  )}
                  {entry.description && (
                    <ReadMore
                      text={entry.description}
                      locale={entry.fmt.locale}
                      lines={6}
                      className="mt-2 max-w-[68ch] leading-relaxed"
                    />
                  )}
                  {entry.href && (
                    <p className="mt-2 text-sm">
                      <NewTabLink href={entry.href} context={entry.title} className={accentLink}>
                        View
                      </NewTabLink>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      );
    case 'testimonials':
      return (
        <>
          <ul className="max-w-[68ch] space-y-8">
            {block.testimonials.map((item) => (
              <li key={item.id}>
                <figure>
                  <blockquote className="text-lg leading-8 whitespace-pre-line">
                    {item.message}
                  </blockquote>
                  <figcaption className="mt-2 text-sm text-muted">
                    <span className="text-ink">{item.name}</span>
                    {item.detail && `, ${item.detail}`}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          {block.submitTo && (
            <div className="mt-8">
              <LeaveTestimonial
                slug={slug}
                ui={block.ui.leave}
                buttonClassName="inline-flex items-center rounded-control border border-line px-4 py-2 text-sm font-semibold hover:bg-accent-soft"
              />
            </div>
          )}
        </>
      );
    default:
      return null;
  }
}

export async function AboutView({ username, locale }: { username: string; locale?: string }) {
  const profile = await load(username, locale);
  const base = canonical(profile, username, locale, '/about');
  if (!pageSplit(profile).about) redirect(base);
  const blocks = buildBlocks(profile, '', 'about');
  const ui = uiFor(profile.locale);

  return (
    <LocaleScope
      locale={profile.locale}
      links={languageLinks(profile, '/about')}
      label={ui.switcher.label}
    >
      <WritingShell profile={profile} current="about">
        <h1 className={heading}>{profile.fullName}</h1>
        {profile.tagline && <p className="mt-1 text-muted">{profile.tagline}</p>}
        <div className="mt-10 space-y-14">
          {blocks.map((block) => (
            <section key={block.id} aria-labelledby={block.id}>
              <h2 id={block.id} className="wr-display mb-5 text-2xl font-semibold">
                {block.title}
              </h2>
              <AboutBlock block={block} slug={profile.slug} />
            </section>
          ))}
        </div>
      </WritingShell>
    </LocaleScope>
  );
}
