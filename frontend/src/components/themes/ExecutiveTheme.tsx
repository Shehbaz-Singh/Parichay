import type { ReactNode } from 'react';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
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
  NewTabLink,
  RoleList,
  TotalExperience,
  FooterLines,
  MoreLinkView,
} from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// A professional, resume-like page: a document on a gray desk with two columns. The left sidebar
// (dark, tinted by the accent) holds the photo, name, tagline, contact links and skills; the wider
// right column holds the rest, in the owner's order. On a phone the sidebar comes first. Dense,
// tidy type; a job is its role, its company and its dates. Source Serif 4 for the name and
// headings, Source Sans 3 for the text. No motion at all. Printing hides the buttons, shows the
// address behind each link, and turns the sidebar white (see .exec-* in globals.css).

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const sans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${serif.variable}`;

const display = 'font-(family-name:--font-theme-display)';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const link = `text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`;
const small = 'text-xs font-bold tracking-[0.14em] uppercase';

function Sidebar({
  header,
  skills,
  idPrefix,
}: {
  header: HeaderModel;
  idPrefix: string;
  skills: Extract<Block, { kind: 'skills' }> | undefined;
}) {
  const contact = `flex max-w-full items-start gap-2.5 py-1 text-sm hover:underline ${focusRing}`;
  const skillList = (items: Extract<Block, { kind: 'skills' }>['skills']) => (
    <ul className="space-y-1.5 text-sm">
      {items.map((skill) => (
        <li
          key={skill.id}
          className="flex items-baseline gap-2.5 before:size-1.5 before:shrink-0 before:bg-accent before:content-[''] print:before:bg-black"
        >
          {skill.name}
        </li>
      ))}
    </ul>
  );
  return (
    <aside className="exec-side p-7 sm:p-9 lg:sticky lg:top-[var(--nav-h,0px)] lg:h-[calc(100vh-var(--nav-h,0px))] lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden xl:p-10 print:static print:h-auto print:overflow-visible print:border-e print:border-line print:p-5">
      <Avatar
        avatar={header.avatar}
        className="size-28 rounded-full ring-4 ring-white/20 print:ring-0"
        placeholderClassName={`${display} bg-surface text-4xl font-semibold`}
      />
      <h1 className={`${display} mt-6 text-3xl leading-tight font-semibold text-balance`}>
        {header.name}
      </h1>
      {header.tagline && (
        <p className="mt-2 leading-snug text-pretty text-muted">{header.tagline}</p>
      )}
      <AvailabilityBadge
        availability={header.availability}
        ui={header.ui}
        className="mt-5 rounded-md border border-line bg-surface px-3 py-2.5 text-sm"
        dotClassName="bg-accent-fg"
        linkClassName={`font-semibold underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
      {header.work && (
        <WorkCard
          work={header.work}
          className="mt-4 rounded-md border border-s-4 border-line border-s-accent bg-surface px-3 py-3 text-ink"
          linkClassName={`font-semibold underline underline-offset-2 hover:no-underline ${focusRing}`}
          buttonClassName={`rounded border border-line px-2.5 py-1 text-xs font-semibold hover:bg-page ${focusRing}`}
        />
      )}

      <section
        aria-labelledby={`${idPrefix}exec-contact`}
        className="mt-8 border-t border-line pt-5"
      >
        <h2 id={`${idPrefix}exec-contact`} className={`${small} mb-3 text-muted`}>
          Contact
        </h2>
        <ul className="space-y-0.5">
          {header.location && (
            <li className="flex items-start gap-2.5 py-1 text-sm">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{header.location}</span>
            </li>
          )}
          {header.links.map((item) => (
            <li key={item.id} className="max-w-full">
              <HeaderLink link={item} className={contact} />
            </li>
          ))}
          {header.contact && (
            <li className="print:hidden">
              <ContactLink contact={header.contact} className={contact} />
            </li>
          )}
          {header.resume && (
            <li className="print:hidden">
              <ResumeLink resume={header.resume} className={contact} />
            </li>
          )}
        </ul>
        <div className="mt-4 print:hidden">
          <ShareButton {...header.share} ui={header.ui.share} variant="outline" />
        </div>
      </section>

      {skills && (
        <section aria-labelledby={skills.id} className="mt-8 border-t border-line pt-5">
          <h2 id={skills.id} className={`${small} mb-3 text-muted`}>
            {skills.title}
          </h2>
          {skillList(skills.skills)}
          {skills.rest.length > 0 && (
            <Collapse
              className="mt-3"
              label={fill(skills.ui.density.moreSkills, { count: skills.rest.length })}
              closeLabel={skills.ui.density.showLess}
              buttonClassName="inline-block text-sm font-semibold underline underline-offset-2 hover:no-underline print:hidden"
            >
              <div className="mt-3">{skillList(skills.rest)}</div>
            </Collapse>
          )}
        </section>
      )}
    </aside>
  );
}

function Section({ block, children }: { block: Block; children: ReactNode }) {
  return (
    <section
      aria-labelledby={block.id}
      className="mt-9 first:mt-0 2xl:break-inside-avoid print:break-inside-auto"
    >
      <h2
        id={block.id}
        className={`${display} relative mb-5 break-after-avoid border-b border-line pb-2 text-xl font-semibold`}
      >
        {block.title}
        <span aria-hidden="true" className="absolute -bottom-px start-0 h-0.5 w-12 bg-accent" />
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
    case 'skills':
      return null; // in the sidebar
    case 'about':
      return (
        <ReadMore
          text={block.text}
          locale={block.locale}
          from={900}
          lines={9}
          className="leading-relaxed"
        />
      );
    case 'projects': {
      const listProjects = (items: typeof block.projects) => (
        <ul className="space-y-5">
          {items.map((project) => (
            <li key={project.id} className="min-w-0 break-inside-avoid">
              <h3 className="font-bold">
                {project.href ? (
                  <NewTabLink
                    href={project.href}
                    className={`inline-flex items-baseline gap-1 ${link}`}
                  >
                    {project.name}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="rtl:-scale-x-100 size-3.5 shrink-0 self-center print:hidden"
                    />
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <ReadMore
                  text={project.description}
                  locale={block.locale}
                  className="mt-1 leading-relaxed"
                />
              )}
              {project.tags.length > 0 && (
                <p className="mt-1 text-sm text-muted">{project.tags.join(' · ')}</p>
              )}
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
          className="space-y-5"
          itemClassName="min-w-0 break-inside-avoid"
          titleClassName="font-bold"
          linkClassName={link}
          metaClassName="mt-0.5 text-sm text-muted"
          excerptClassName="mt-1 leading-relaxed"
          moreClassName={`mt-5 inline-block text-sm font-semibold print:hidden ${link}`}
        />
      );
    case 'testimonials': {
      const listTestimonials = (items: typeof block.testimonials) => (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="min-w-0 break-inside-avoid">
              <figure className="border-s-2 border-accent ps-4">
                <blockquote className={`${display} leading-relaxed whitespace-pre-line italic`}>
                  {item.message}
                </blockquote>
                <figcaption className="mt-2 text-sm">
                  <span className="font-bold">{item.name}</span>
                  {item.detail && <span className="text-muted">, {item.detail}</span>}
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
            <div className="mt-6 print:hidden">
              <LeaveTestimonial
                slug={block.submitTo}
                ui={block.ui.leave}
                buttonClassName={`inline-flex items-center rounded border border-ink px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-page ${focusRing}`}
              />
            </div>
          )}
        </>
      );
    }
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`inline-flex items-center rounded border border-ink px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-page ${focusRing}`}
          />
        </div>
      );
    case 'entries': {
      const listEntries = (items: typeof block.entries) => (
        <ol className="space-y-6">
          {items.map((entry) => (
            <li key={entry.id} className="min-w-0 break-inside-avoid">
              {/* Role, company, dates: the role and the dates share the first line. */}
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h3 className={`${display} text-lg leading-snug font-semibold`}>{entry.title}</h3>
                {entry.start && (
                  <p className="text-sm font-semibold text-muted tabular-nums sm:shrink-0 sm:whitespace-nowrap">
                    <DateRange
                      start={entry.start}
                      end={entry.end}
                      openEnded={block.variant !== 'custom'}
                      duration={entry.duration}
                      fmt={entry.fmt}
                    />
                  </p>
                )}
              </div>
              {entry.subtitle && <p className="font-semibold text-muted">{entry.subtitle}</p>}
              {entry.roles && (
                <RoleList
                  roles={entry.roles}
                  className="mt-3 space-y-4 border-s border-line ps-4"
                  roleClassName="break-inside-avoid"
                  titleClassName="font-bold"
                  datesClassName="text-sm font-semibold text-muted tabular-nums"
                  descriptionClassName="mt-1 leading-relaxed"
                />
              )}
              {entry.description && (
                <ReadMore
                  text={entry.description}
                  locale={entry.fmt.locale}
                  className="mt-2 leading-relaxed"
                />
              )}
              {entry.href && (
                <p className="mt-2 text-sm">
                  <NewTabLink href={entry.href} context={entry.title} className={link}>
                    View
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
            className="mb-4 text-sm text-muted"
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
    <footer className="mt-14 border-t border-line pt-6 text-sm text-muted print:mt-6 print:pt-3">
      <FooterLines
        footer={footer}
        linkClassName={`font-semibold text-ink underline ${focusRing}`}
      />
    </footer>
  );
}

export default function ExecutiveTheme({ profile, idPrefix = '', view, nav }: ThemeProps) {
  const blocks = buildBlocks(profile, idPrefix, view);
  const skills = blocks.find((block) => block.kind === 'skills');
  const main = blocks.filter((block) => block.kind !== 'skills');
  return (
    <ThemeWrapper theme="executive" profile={profile} nav={nav} className={fontClass}>
      <div className="print:max-w-none print:p-0">
        <div className="exec-sheet bg-surface lg:grid lg:min-h-screen lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)] print:grid print:grid-cols-[13rem_minmax(0,1fr)]">
          <Sidebar header={buildHeader(profile)} skills={skills} idPrefix={idPrefix} />
          <main
            id={`${idPrefix}main`}
            className="min-w-0 p-7 sm:p-10 lg:px-[clamp(2.5rem,4vw,6rem)] lg:py-14 print:p-5 print:pt-1"
          >
            {/* Sections flow down the page in the order the owner chose, and on a wide screen
                across two or three columns instead of one long strip. */}
            <div className="2xl:columns-2 2xl:gap-x-20 min-[2200px]:columns-3 print:columns-1">
              {main.map((block) => (
                <Section key={block.id} block={block}>
                  <BlockView block={block} />
                </Section>
              ))}
            </div>
            {main.length === 0 && (
              <EmptyPage text={uiFor(profile.locale).emptyPage} className="text-muted" />
            )}
            <Footer footer={buildFooter(profile)} />
          </main>
        </div>
      </div>
    </ThemeWrapper>
  );
}
