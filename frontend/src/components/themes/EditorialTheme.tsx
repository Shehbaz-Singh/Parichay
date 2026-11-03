import type { ReactNode } from 'react';
import { pageLabel } from '@/lib/pages';
import Link from 'next/link';
import { Hanken_Grotesk, Newsreader } from 'next/font/google';
import { MapPin } from 'lucide-react';
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
import { EditorialPages } from './templates/EditorialPages';
import { pageView } from './templates/model';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// A quiet magazine page on warm paper (.theme-editorial). A narrow reading column; a masthead with a
// large serif name between two rules; the About text opens with a drop cap; section labels are small
// capitals on a thin rule; jobs hang their dates in a left column; projects are text, not cards;
// skills run on as a sentence; testimonials are pull quotes. The accent is used sparingly: links,
// the short rule before a label, the drop cap and the quotation marks.
// Newsreader for display, Hanken Grotesk for text.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${serif.variable}`;

const display = 'font-(family-name:--font-theme-display)';
const caps = 'text-xs font-semibold tracking-[0.18em] uppercase';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const link = `ed-underline text-accent-fg ${focusRing}`;

function Section({ block, children }: { block: Block; children: ReactNode }) {
  // On a wide screen the label sits in a left rail (and stays in view while you read the section)
  // and the content takes the rest, so the page uses the width instead of one narrow column.
  return (
    <section
      aria-labelledby={block.id}
      className="mt-16 sm:mt-24 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-x-20"
    >
      <h2
        id={block.id}
        className={`${caps} mb-8 flex items-center gap-4 lg:sticky lg:top-[calc(2rem+var(--nav-h,0px))] lg:mb-0 lg:flex-col lg:items-start lg:gap-3 lg:self-start`}
      >
        <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
        <span className="min-w-0">{block.title}</span>
        <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line lg:hidden" />
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Masthead({ header }: { header: HeaderModel }) {
  return (
    <header className="rise-in text-center lg:text-start">
      {/* The location, when there is one, between two rules. With none there is no label: a "Portfolio"
          caption above every name says nothing. */}
      <div className="border-y border-ink py-3">
        <p
          className={`${caps} flex items-center justify-center gap-1.5 text-muted lg:justify-start`}
        >
          {header.location && (
            <>
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{header.location}</span>
            </>
          )}
        </p>
      </div>
      <div className="lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-end lg:gap-x-20">
        <div className="min-w-0">
          <Avatar
            avatar={header.avatar}
            className="mx-auto mt-10 size-24 rounded-full lg:mx-0 lg:mt-0 lg:size-28"
            placeholderClassName={`${display} border border-ink text-3xl text-ink`}
          />
          <h1
            className={`${display} mt-8 text-[clamp(2.75rem,10vw,5.5rem)] leading-[1.02] lg:text-[clamp(4rem,7.5vw,11rem)] lg:leading-[0.95] font-medium tracking-tight text-balance`}
          >
            {header.name}
          </h1>
          {header.tagline && (
            <p
              className={`${display} mx-auto mt-5 max-w-xl text-xl leading-snug text-pretty text-muted italic sm:text-2xl lg:mx-0 lg:max-w-3xl lg:text-3xl`}
            >
              {header.tagline}
            </p>
          )}
        </div>
        <div className="min-w-0">
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="mx-auto mt-6 w-fit lg:mx-0 justify-center border border-line px-4 py-2.5 text-start text-sm text-ink"
            dotClassName="bg-accent-fg"
            linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          />
          {header.work && (
            <WorkCard
              work={header.work}
              className="mx-auto mt-4 w-full max-w-sm border border-line px-4 py-3 text-start text-ink lg:mx-0"
              linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
            />
          )}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-line py-4 text-sm lg:justify-start">
            {header.links.map((item) => (
              <li key={item.id} className="max-w-full">
                <HeaderLink link={item} className={`inline-flex items-center gap-2 ${link}`} />
              </li>
            ))}
            {header.contact && (
              <li className="print:hidden">
                <ContactLink
                  contact={header.contact}
                  className={`inline-flex items-center gap-2 ${link}`}
                />
              </li>
            )}
            {header.resume && (
              <li>
                <ResumeLink
                  resume={header.resume}
                  className={`inline-flex items-center gap-2 ${link}`}
                />
              </li>
            )}
            <li>
              <ShareButton {...header.share} ui={header.ui.share} variant="outline" />
            </li>
          </ul>
        </div>
      </div>
    </header>
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
        <p
          className={`${display} max-w-3xl text-xl leading-relaxed whitespace-pre-line xl:max-w-none xl:columns-2 xl:gap-16 first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-accent-fg sm:text-[1.35rem] sm:leading-[1.7]`}
        >
          {block.text}
        </p>
      );
    case 'skills': {
      // Reads as one sentence: the items are inline.
      const listSkills = (items: typeof block.skills) => (
        <ul className={`${display} max-w-5xl text-xl leading-9`}>
          {items.map((skill) => (
            <li key={skill.id} className="inline after:content-[',_'] last:after:content-['.']">
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
        <ul className="grid gap-y-12 xl:grid-cols-2 xl:gap-x-14 2xl:grid-cols-3">
          {items.map((project) => (
            <li
              key={project.id}
              className={`ed-hover group relative min-w-0 ${isHeroProject(block, project) ? 'xl:col-span-2 2xl:col-span-3' : ''}`}
            >
              <ProjectCover
                project={project}
                className={`mb-4 w-full object-cover ${isHeroProject(block, project) ? 'aspect-[21/9]' : 'aspect-[40/21]'}`}
              />
              <h3
                className={`${display} leading-tight font-medium ${isHeroProject(block, project) ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl'}`}
              >
                <Link
                  href={project.detailHref}
                  className={`after:absolute after:inset-0 ${focusRing}`}
                >
                  <span className="ed-underline">{project.name}</span>
                </Link>
              </h3>
              {project.description && (
                <ReadMore
                  text={project.description}
                  locale={block.locale}
                  className="mt-3 leading-relaxed"
                />
              )}
              {project.tags.length > 0 && (
                <p className={`${display} mt-3 text-muted italic`}>{project.tags.join(' · ')}</p>
              )}
              <ProjectVisit
                project={project}
                label={block.ui.viewProject}
                className={`text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`}
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
          className="space-y-12"
          itemClassName="ed-hover group relative min-w-0"
          coverClassName="mb-4 aspect-[40/21] w-full object-cover"
          titleClassName={`${display} text-2xl leading-tight font-medium sm:text-3xl`}
          linkClassName={`after:absolute after:inset-0 ${focusRing}`}
          metaClassName={`${display} mt-2 text-muted italic`}
          excerptClassName="mt-3 leading-relaxed"
          moreClassName={`mt-10 inline-block text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
      );
    case 'testimonials': {
      const listTestimonials = (items: typeof block.testimonials) => (
        <ul className="grid gap-16 xl:grid-cols-2 xl:gap-x-20">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <figure>
                <span
                  aria-hidden="true"
                  className={`${display} block h-12 text-8xl leading-[0.9] text-accent-fg`}
                >
                  “
                </span>
                <blockquote
                  className={`${display} text-2xl leading-snug whitespace-pre-line italic sm:text-[1.7rem]`}
                >
                  {item.message}
                </blockquote>
                <figcaption className={`${caps} mt-6 text-muted`}>
                  <span className="text-ink">{item.name}</span>
                  {item.detail && <span>, {item.detail}</span>}
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
              buttonClassName={`mt-10 inline-flex items-center text-sm font-medium ${link}`}
            />
          )}
        </>
      );
    }
    case 'cta':
      return (
        <CtaView
          block={block}
          linkClassName={`inline-flex items-center gap-2 font-medium text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`}
        />
      );
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`inline-flex items-center text-sm font-medium ${link}`}
          />
        </div>
      );
    case 'entries': {
      const listEntries = (items: typeof block.entries) => (
        <ol className="divide-y divide-line border-y border-line 2xl:grid 2xl:grid-cols-2 2xl:gap-x-16 2xl:divide-y-0 2xl:border-y-0">
          {items.map((entry) => (
            <li
              key={entry.id}
              className={`min-w-0 py-7 2xl:border-t 2xl:border-line ${entry.start ? 'md:grid md:grid-cols-[8.5rem_minmax(0,1fr)] md:gap-8' : ''}`}
            >
              {entry.start && (
                <p className="mb-2 text-sm text-muted tabular-nums md:mt-1.5 md:mb-0">
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
                <h3 className={`${display} text-xl leading-snug font-medium sm:text-2xl`}>
                  {entry.title}
                </h3>
                {entry.subtitle && (
                  <p className={`${display} text-lg text-muted italic`}>{entry.subtitle}</p>
                )}
                {entry.roles && (
                  <RoleList
                    roles={entry.roles}
                    className="mt-4 space-y-6 border-s border-line ps-5"
                    titleClassName={`${display} text-lg font-medium`}
                    datesClassName="text-sm text-muted tabular-nums"
                    descriptionClassName="mt-2 leading-relaxed"
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
                  <p className="mt-3 text-sm">
                    <NewTabLink href={entry.href} context={entry.title} className={link}>
                      View
                    </NewTabLink>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      );
      return (
        <>
          <TotalExperience
            total={block.total}
            label={block.ui.totalExperience}
            className="mb-5 text-sm text-muted"
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
    <footer className="mx-auto max-w-[110rem] px-5 sm:px-8 lg:px-[clamp(3rem,6vw,8rem)] pb-12">
      <div
        className={`${display} mt-24 border-t border-ink pt-6 text-center text-sm text-muted italic`}
      >
        <FooterLines footer={footer} linkClassName={link} />
      </div>
    </footer>
  );
}

export default function EditorialTheme({
  profile,
  idPrefix = '',
  page,
  nav,
  heading,
  lead,
  project,
  contact,
}: ThemeProps) {
  // A multi-page portfolio (or a project's own page) is drawn by the theme's page templates.
  const view = pageView(profile, { page, project, contact });
  if (view) {
    return (
      <EditorialPages
        profile={profile}
        view={view}
        nav={nav}
        idPrefix={idPrefix}
        fontClass={fontClass}
        hero={<Masthead header={buildHeader(profile)} />}
        renderBlock={(block) => <BlockView block={block} />}
        Section={Section}
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
        wrapClassName="mb-12 flex items-center gap-5 border-b border-line pb-8"
        avatarClassName="size-20 shrink-0 rounded-full sm:size-28"
        placeholderClassName={`${display} bg-surface text-3xl text-ink`}
        nameClassName={`${display} text-2xl font-medium`}
        taglineClassName="mt-1 text-lg text-muted italic"
        metaClassName="mt-1 text-sm text-muted"
        pillClassName={`inline-flex items-center gap-2 border-b border-ink pb-0.5 text-sm hover:border-b-2 ${focusRing}`}
        badgeClassName="mt-3 text-sm text-ink"
        badgeDotClassName="bg-accent-fg"
        badgeLinkClassName={`font-medium text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
    ) : null;
  return (
    <ThemeWrapper theme="editorial" profile={profile} nav={nav} className={fontClass}>
      <main
        id={`${idPrefix}main`}
        className="mx-auto max-w-[110rem] px-5 sm:px-8 lg:px-[clamp(3rem,6vw,8rem)] py-10 sm:py-16"
      >
        {lead ??
          (heading ? (
            <PageHeading
              heading={heading}
              title={page ? pageLabel(profile, page) : undefined}
              kicker={profile.fullName}
              wrapClassName="mb-10 border-b border-ink pb-8 sm:mb-14"
              kickerClassName={`${display} mb-3 text-lg text-muted italic`}
              className={`${display} text-6xl leading-[0.95] font-medium tracking-tight text-balance sm:text-8xl`}
            />
          ) : (
            <Masthead header={buildHeader(profile)} />
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
            className={`${display} mt-16 text-center text-muted italic`}
          />
        )}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}
