import type { ReactNode } from 'react';
import { pageLabel } from '@/lib/pages';
import Link from 'next/link';
import { Fraunces, Nunito_Sans } from 'next/font/google';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { ShareButton } from '../ShareButton';
import {
  buildBlocks,
  buildFooter,
  buildHeader,
  type Block,
  type FooterModel,
  type HeaderModel,
} from './blocks';
import { fill, uiFor } from '@/lib/i18n';
import { Collapse } from './Collapse';
import { ReadMore } from './ReadMore';
import { ContactForm } from './ContactForm';
import { LeaveTestimonial } from './LeaveTestimonial';
import { WorkCard } from './WorkCard';
import {
  Avatar,
  DateRange,
  EmptyPage,
  AvailabilityBadge,
  HeaderLink,
  ContactLink,
  ResumeLink,
  WritingList,
  InitialsBadge,
  NewTabLink,
  RoleList,
  TotalExperience,
  FooterLines,
  MoreLinkView,
  PageHeading,
  ProjectCover,
  ProjectVisit,
  CtaView,
  IdentityStrip,
  isHeroProject,
} from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import { SoftPages } from './templates/SoftPages';
import { pageView } from './templates/model';
import type { ThemeProps } from './types';

// Warm and calm. A centered introduction (a big round photo, the name, one line), then one narrow
// column of sections with room between them. Open panels with a hairline, not stacked shadows:
// jobs hang on a quiet timeline, skills are small tinted chips, testimonials are quotes on a soft
// tint. One tint of the accent and nothing that moves. Text is always the dark ink on white or on
// the tint, never the accent, so contrast does not depend on the color the owner picked. Fraunces
// for headings, Nunito Sans for text.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const sans = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${fraunces.variable}`;

const display = 'font-(family-name:--font-theme-display)';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const card = 'rounded-3xl border border-line bg-surface';
const chip = 'rounded-full bg-accent-soft px-3.5 py-1 text-sm font-semibold';

function Header({ header }: { header: HeaderModel }) {
  const pill = `inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-accent-soft ${focusRing}`;
  return (
    <header className="rise-in flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-10 sm:text-start">
      <Avatar
        avatar={header.avatar}
        className="size-32 shrink-0 rounded-full ring-4 ring-surface sm:size-44"
        placeholderClassName={`${display} bg-accent-soft text-5xl font-medium text-ink sm:text-6xl`}
      />
      <div className="min-w-0">
        <h1
          className={`${display} text-[clamp(2rem,6vw,3.25rem)] leading-[1.1] font-medium text-balance`}
        >
          {header.name}
        </h1>
        {header.tagline && (
          <p className="mt-2 max-w-xl text-lg leading-snug text-pretty text-muted sm:text-xl">
            {header.tagline}
          </p>
        )}
        {header.location && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span>{header.location}</span>
          </p>
        )}
        <AvailabilityBadge
          availability={header.availability}
          ui={header.ui}
          className="mt-4 max-w-xl justify-center rounded-3xl bg-accent-soft px-4 py-2 text-start text-sm text-ink sm:justify-start"
          dotClassName="bg-accent-fg"
          linkClassName={`font-bold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
        {header.work && (
          <WorkCard
            work={header.work}
            className="mt-3 max-w-xl rounded-3xl bg-accent-soft px-4 py-2.5 text-start text-ink"
            linkClassName={`font-bold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
            buttonClassName={`rounded-full bg-ink px-3 py-1 text-xs font-bold text-page hover:opacity-90 ${focusRing}`}
          />
        )}
        <ul className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
          {header.links.map((item) => (
            <li key={item.id} className="max-w-full">
              <HeaderLink link={item} className={pill} />
            </li>
          ))}
          {header.contact && (
            <li className="print:hidden">
              <ContactLink contact={header.contact} className={pill} />
            </li>
          )}
          {header.resume && (
            <li>
              <ResumeLink resume={header.resume} className={pill} />
            </li>
          )}
          <li>
            <ShareButton {...header.share} ui={header.ui.share} variant="outline" />
          </li>
        </ul>
      </div>
    </header>
  );
}

function Section({ block, children }: { block: Block; children: ReactNode }) {
  return (
    <section aria-labelledby={block.id} className="mt-10 sm:mt-14">
      <h2 id={block.id} className={`${display} mb-5 text-2xl font-medium text-balance sm:text-3xl`}>
        {block.title}
      </h2>
      {children}
    </section>
  );
}

// The block, and the way on to the rest when this is the short home page of a heavy profile.
function BlockView({ block }: { block: Block }) {
  return (
    <>
      <BlockBody block={block} />
      {block.moreLink && <MoreLinkView more={block.moreLink} />}
    </>
  );
}

function BlockBody({ block }: { block: Block }) {
  switch (block.kind) {
    case 'about':
      return (
        <ReadMore
          text={block.text}
          locale={block.locale}
          from={900}
          lines={9}
          className="text-lg leading-8 sm:text-xl sm:leading-9"
        />
      );
    case 'skills': {
      const listSkills = (items: typeof block.skills) => (
        <ul className="flex flex-wrap gap-2.5">
          {items.map((skill) => (
            <li key={skill.id} className={chip}>
              {skill.name}
            </li>
          ))}
        </ul>
      );
      return (
        <>
          {listSkills(block.skills)}
          {block.rest.length > 0 && (
            <Collapse
              className="mt-6"
              label={fill(block.ui.density.moreSkills, { count: block.rest.length })}
              closeLabel={block.ui.density.showLess}
            >
              {listSkills(block.rest)}
            </Collapse>
          )}
        </>
      );
    }
    case 'projects': {
      const listProjects = (items: typeof block.projects) => (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <li
              key={project.id}
              className={`${card} group relative flex min-w-0 flex-col p-5 ${isHeroProject(block, project) ? 'md:col-span-2 lg:col-span-3 md:p-7' : ''}`}
            >
              <ProjectCover
                project={project}
                className={`mb-4 w-full rounded-2xl object-cover ${isHeroProject(block, project) ? 'aspect-[21/9]' : 'aspect-[40/21]'}`}
              />
              <h3
                className={`${display} leading-snug font-medium ${isHeroProject(block, project) ? 'text-3xl' : 'text-xl'}`}
              >
                <Link
                  href={project.detailHref}
                  className={`underline decoration-line underline-offset-4 group-hover:decoration-current after:absolute after:inset-0 after:rounded-3xl ${focusRing}`}
                >
                  {project.name}
                </Link>
              </h3>
              {project.description && (
                <ReadMore
                  text={project.description}
                  locale={block.locale}
                  className="mt-3 flex-1 leading-relaxed text-muted"
                />
              )}
              {project.tags.length > 0 && (
                <p className="mt-4 text-sm text-muted">{project.tags.join(' · ')}</p>
              )}
              <ProjectVisit
                project={project}
                label={block.ui.viewProject}
                className={`inline-flex items-center gap-1 text-sm font-bold text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`}
              />
            </li>
          ))}
        </ul>
      );
      return (
        <>
          {listProjects(block.projects)}
          {block.rest.length > 0 && (
            <Collapse
              className="mt-6"
              label={fill(block.ui.density.moreProjects, { count: block.rest.length })}
              closeLabel={block.ui.density.showLess}
            >
              {listProjects(block.rest)}
            </Collapse>
          )}
        </>
      );
    }
    case 'writing':
      return (
        <WritingList
          block={block}
          className="grid gap-6 md:grid-cols-2"
          itemClassName={`${card} group relative flex min-w-0 flex-col p-6`}
          coverClassName="mb-5 aspect-[40/21] w-full rounded-2xl object-cover"
          titleClassName={`${display} text-xl leading-snug font-medium`}
          linkClassName={`after:absolute after:inset-0 after:rounded-3xl ${focusRing}`}
          metaClassName="mt-1 text-sm text-muted"
          excerptClassName="mt-3 leading-relaxed text-muted"
          moreClassName={`mt-6 inline-block font-bold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
      );
    case 'testimonials': {
      const listTestimonials = (items: typeof block.testimonials) => (
        <ul className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <figure className="flex h-full flex-col rounded-3xl bg-accent-soft p-6">
                <blockquote className="flex-1 text-lg leading-relaxed whitespace-pre-line">
                  {item.message}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 text-sm">
                  <InitialsBadge
                    name={item.name}
                    className={`${display} size-10 bg-surface text-base text-ink`}
                  />
                  <span className="min-w-0">
                    <span className="block font-bold">{item.name}</span>
                    {item.detail && <span className="block text-muted">{item.detail}</span>}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      );
      return (
        <>
          {block.testimonials.length > 0 ? (
            <>
              {listTestimonials(block.testimonials)}
              {block.rest.length > 0 && (
                <Collapse
                  className="mt-6"
                  label={fill(block.ui.density.moreTestimonials, { count: block.rest.length })}
                  closeLabel={block.ui.density.showLess}
                >
                  {listTestimonials(block.rest)}
                </Collapse>
              )}
            </>
          ) : null}
          {block.submitTo && (
            <LeaveTestimonial
              slug={block.submitTo}
              ui={block.ui.leave}
              buttonClassName={`mt-10 inline-flex items-center rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-page transition-opacity duration-200 hover:opacity-90 ${focusRing}`}
            />
          )}
        </>
      );
    }
    case 'cta':
      return (
        <CtaView
          block={block}
          linkClassName={`inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-page transition-opacity duration-200 hover:opacity-90 ${focusRing}`}
        />
      );
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`inline-flex items-center rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-page transition-opacity duration-200 hover:opacity-90 ${focusRing}`}
          />
        </div>
      );
    case 'entries': {
      const listEntries = (items: typeof block.entries) => (
        <ol className="space-y-6 border-s-2 border-line ps-6">
          {items.map((entry) => (
            <li key={entry.id} className="relative min-w-0">
              <span
                aria-hidden="true"
                className="absolute -start-[1.9rem] top-2 size-3 rounded-full bg-accent ring-4 ring-page"
              />
              {entry.start && (
                <p className="mb-1 text-sm text-muted tabular-nums">
                  <DateRange
                    start={entry.start}
                    end={entry.end}
                    openEnded={block.variant !== 'custom'}
                    duration={entry.duration}
                    fmt={entry.fmt}
                  />
                </p>
              )}
              <h3 className={`${display} text-xl leading-snug font-medium sm:text-2xl`}>
                {entry.title}
              </h3>
              {entry.subtitle && <p className="mt-0.5 text-muted">{entry.subtitle}</p>}
              {entry.roles && (
                <RoleList
                  roles={entry.roles}
                  className="mt-4 space-y-4 border-s border-line ps-4"
                  titleClassName={`${display} text-lg font-medium`}
                  datesClassName="text-sm text-muted tabular-nums"
                  descriptionClassName="mt-1 leading-relaxed"
                />
              )}
              {entry.description && (
                <ReadMore
                  text={entry.description}
                  locale={entry.fmt.locale}
                  className="mt-3 leading-relaxed"
                />
              )}
              {entry.href && (
                <p className="mt-3">
                  <NewTabLink
                    href={entry.href}
                    context={entry.title}
                    className={`inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4 hover:no-underline ${focusRing}`}
                  >
                    View
                    <ArrowUpRight aria-hidden="true" className="rtl:-scale-x-100 size-4" />
                  </NewTabLink>
                </p>
              )}
            </li>
          ))}
        </ol>
      );
      return (
        <>
          <TotalExperience
            total={block.total}
            label={block.ui.totalExperience}
            className="mb-5 inline-block rounded-full bg-accent-soft px-4 py-1 text-sm font-semibold"
          />
          {listEntries(block.entries)}
          {block.variant === 'experience' && block.rest.length > 0 && (
            <Collapse
              className="mt-6"
              label={fill(block.ui.density.earlierRoles, { count: block.rest.length })}
              closeLabel={block.ui.density.showLess}
            >
              {listEntries(block.rest)}
            </Collapse>
          )}
        </>
      );
    }
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mx-auto max-w-4xl px-5 pb-12 text-center text-sm text-muted sm:px-8">
      <FooterLines
        footer={footer}
        yearClassName="mt-24"
        linkClassName={`font-bold text-ink underline underline-offset-4 hover:no-underline ${focusRing}`}
      />
    </footer>
  );
}

export default function SoftTheme({
  profile,
  idPrefix = '',
  page,
  nav,
  heading,
  lead,
  project,
  contact,
}: ThemeProps) {
  // A multi-page portfolio's pages (and a project's page) have templates of their own.
  const view = pageView(profile, { page, project, contact });
  if (view) {
    return (
      <SoftPages
        profile={profile}
        view={view}
        nav={nav}
        idPrefix={idPrefix}
        fontClass={fontClass}
        renderBlock={(block) => <BlockView block={block} />}
        Section={Section}
        hero={<Header header={buildHeader(profile)} />}
        footer={<Footer footer={buildFooter(profile)} />}
      />
    );
  }
  const blocks = buildBlocks(profile, idPrefix, page);
  const identity =
    heading && !lead && page && (page.key === 'work' || page.key === 'about') ? (
      <IdentityStrip
        header={buildHeader(profile)}
        full={page.key === 'about'}
        wrapClassName="mx-auto mt-6 mb-4 flex max-w-2xl flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-start"
        avatarClassName="size-24 shrink-0 rounded-full ring-4 ring-surface sm:size-28"
        placeholderClassName={`${display} bg-accent-soft text-4xl font-medium text-ink`}
        nameClassName={`${display} text-xl font-medium`}
        taglineClassName="mt-1 text-lg leading-snug text-muted"
        metaClassName="mt-2 text-sm text-muted"
        pillClassName={`inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-accent-soft ${focusRing}`}
        badgeClassName="mt-3 max-w-xl justify-center rounded-3xl bg-accent-soft px-4 py-2 text-start text-sm text-ink sm:justify-start"
        badgeDotClassName="bg-accent-fg"
        badgeLinkClassName={`font-bold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
    ) : null;
  return (
    <ThemeWrapper theme="soft" profile={profile} nav={nav} className={fontClass}>
      <main id={`${idPrefix}main`} className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {lead ??
          (heading ? (
            <PageHeading
              heading={heading}
              title={page ? pageLabel(profile, page) : undefined}
              kicker={profile.fullName}
              wrapClassName="mb-2 text-center sm:mb-4"
              kickerClassName="mb-3 text-sm text-muted"
              className={`${display} text-[clamp(2.25rem,7vw,3.75rem)] leading-[1.1] font-medium text-balance`}
            />
          ) : (
            <Header header={buildHeader(profile)} />
          ))}
        {identity}
        {blocks.map((block) => (
          <Section key={block.id} block={block}>
            <BlockView block={block} />
          </Section>
        ))}
        {blocks.length === 0 && !lead && (
          <EmptyPage
            text={uiFor(profile.locale).emptyPage}
            className="mt-16 text-center text-muted"
          />
        )}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}
