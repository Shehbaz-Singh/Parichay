import type { ReactNode } from 'react';
import { pageLabel } from '@/lib/pages';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
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
import { uiFor } from '@/lib/i18n';
import { ReadMore } from './ReadMore';
import { fill } from '@/lib/i18n';
import { EntryList, Expander, ProjectList, SkillList } from './kit';
import { ContactForm } from './ContactForm';
import { LeaveTestimonial } from './LeaveTestimonial';
import { WorkCard } from './WorkCard';
import {
  Avatar,
  EmptyPage,
  AvailabilityBadge,
  HeaderLink,
  ContactLink,
  ResumeLink,
  WritingList,
  FooterLines,
  MoreLinkView,
  PageHeading,
  CtaView,
} from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';
import { ExecutivePages } from './templates/ExecutivePages';
import { pageView } from './templates/model';

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
const small = 'pt-label';

function Sidebar({
  header,
  skills,
  idPrefix,
  nameAsParagraph = false,
}: {
  header: HeaderModel;
  idPrefix: string;
  nameAsParagraph?: boolean; // the page's own template carries the h1
  skills: Extract<Block, { kind: 'skills' }> | undefined;
}) {
  const contact = `flex max-w-full items-start gap-2.5 py-1 pt-small hover:underline ${focusRing}`;
  return (
    <aside className="exec-side p-7 sm:p-9 lg:sticky lg:top-[var(--nav-h,0px)] lg:h-[calc(100vh-var(--nav-h,0px))] lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden xl:p-10 print:static print:h-auto print:overflow-visible print:border-e print:border-line print:p-5">
      <Avatar
        avatar={header.avatar}
        className="size-28 rounded-full ring-4 ring-white/20 print:ring-0"
        placeholderClassName={`${display} bg-surface pt-title font-semibold`}
      />
      {nameAsParagraph ? (
        <p className={`${display} pt-title pt-name mt-6 font-semibold`}>
          {header.name}
        </p>
      ) : (
        <h1 className={`${display} pt-title pt-name mt-6 font-semibold`}>
          {header.name}
        </h1>
      )}
      {header.tagline && (
        <p className="pt-small mt-2 text-muted">{header.tagline}</p>
      )}
      <AvailabilityBadge
        availability={header.availability}
        ui={header.ui}
        className="mt-5 rounded-md border border-line bg-surface px-3 py-2.5 pt-small"
        dotClassName="bg-accent-fg"
        linkClassName={`font-semibold underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
      {header.work && (
        <WorkCard
          work={header.work}
          className="mt-4 rounded-md border border-s-4 border-line border-s-accent bg-surface px-3 py-3 text-ink"
          linkClassName={`font-semibold underline underline-offset-2 hover:no-underline ${focusRing}`}
          buttonClassName={`rounded border border-line px-2.5 py-1 pt-fine font-semibold hover:bg-page ${focusRing}`}
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
            <li className="flex items-start gap-2.5 py-1 pt-small">
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
          <SkillList
            block={skills}
            itemClassName="flex items-baseline gap-2.5 before:size-1.5 before:shrink-0 before:bg-accent before:content-[''] print:before:bg-black"
            expanderClassName="[&_.collapse-btn]:text-ink"
          />
        </section>
      )}
    </aside>
  );
}

// Experience is the strongest section: a larger heading over a heavier rule. Everything else is one step down.
function Section({ block, children }: { block: Block; children: ReactNode }) {
  const lead = block.kind === 'entries' && block.variant === 'experience';
  return (
    <section
      aria-labelledby={block.id}
      className="mt-12 first:mt-0 print:break-inside-auto"
    >
      <h2
        id={block.id}
        className={`${display} relative mb-5 break-after-avoid border-b pb-2 font-semibold ${
          lead ? 'pt-h1 border-ink' : 'pt-h2 border-line'
        }`}
      >
        {block.title}
        <span
          aria-hidden="true"
          className={`absolute -bottom-px start-0 w-12 bg-accent ${lead ? 'h-[3px]' : 'h-0.5'}`}
        />
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
          className="pt-body"
        />
      );
    case 'projects':
      return (
        <ProjectList
          block={block}
          classes={{ title: display, link, meta: 'text-muted', cover: 'border border-line' }}
        />
      );
    case 'writing':
      return (
        <WritingList
          block={block}
          className="space-y-5"
          itemClassName="min-w-0 break-inside-avoid"
          titleClassName="font-bold"
          linkClassName={link}
          metaClassName="pt-small mt-0.5 text-muted"
          excerptClassName="pt-body mt-1"
          moreClassName={`pt-small mt-5 inline-block font-semibold print:hidden ${link}`}
        />
      );
    case 'testimonials': {
      const listTestimonials = (items: typeof block.testimonials) => (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="min-w-0 break-inside-avoid">
              <figure className="border-s-2 border-accent ps-4">
                <blockquote className={`${display} pt-body whitespace-pre-line italic`}>
                  {item.message}
                </blockquote>
                <figcaption className="pt-small mt-2">
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
                <Expander
                  label={fill(block.ui.density.moreTestimonials, { count: block.rest.length })}
                  closeLabel={block.ui.density.showLess}
                >
                  {listTestimonials(block.rest)}
                </Expander>
              )}
            </>
          ) : null}
          {block.submitTo && (
            <div className="mt-6 print:hidden">
              <LeaveTestimonial
                slug={block.submitTo}
                ui={block.ui.leave}
                buttonClassName={`inline-flex items-center rounded border border-ink px-4 py-1.5 pt-small font-semibold transition-colors hover:bg-page ${focusRing}`}
              />
            </div>
          )}
        </>
      );
    }
    case 'cta':
      return (
        <CtaView
          block={block}
          className="print:hidden"
          linkClassName={`inline-flex items-center gap-2 rounded border border-ink px-4 py-1.5 pt-small font-semibold transition-colors hover:bg-page ${focusRing}`}
        />
      );
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`inline-flex items-center rounded border border-ink px-4 py-1.5 pt-small font-semibold transition-colors hover:bg-page ${focusRing}`}
          />
        </div>
      );
    case 'entries':
      return (
        <EntryList
          block={block}
          totalClassName="text-muted"
          classes={{ title: display, org: 'text-muted', dates: 'font-semibold text-muted' }}
        />
      );
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="pt-small mt-14 border-t border-line pt-6 text-muted print:mt-6 print:pt-3">
      <FooterLines
        footer={footer}
        linkClassName={`font-semibold text-ink underline ${focusRing}`}
      />
    </footer>
  );
}

export default function ExecutiveTheme({
  profile,
  idPrefix = '',
  page,
  nav,
  heading,
  lead,
  project,
  contact,
}: ThemeProps) {
  // The pages of a multi-page portfolio (and a project's own page) have templates of their own.
  const view = pageView(profile, { page, project, contact });
  if (view) {
    const all = buildBlocks(profile, idPrefix);
    return (
      <ExecutivePages
        profile={profile}
        view={view}
        nav={nav}
        idPrefix={idPrefix}
        fontClass={fontClass}
        sidebar={
          <Sidebar
            header={buildHeader(profile)}
            skills={all.find((block) => block.kind === 'skills')}
            idPrefix={idPrefix}
            nameAsParagraph
          />
        }
        footer={<Footer footer={buildFooter(profile)} />}
        renderBlock={(block) => <BlockView block={block} />}
        Section={Section}
      />
    );
  }
  const blocks = buildBlocks(profile, idPrefix, page);
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
            {lead ??
              (heading && (
                <PageHeading
                  heading={heading}
                  title={page ? pageLabel(profile, page) : undefined}
                  kicker={profile.fullName}
                  wrapClassName="mb-8 border-b-2 border-ink pb-3"
                  kickerClassName="pt-label mb-1 text-muted"
                  className={`pt-title pt-name font-bold`}
                />
              ))}
            {/* Sections flow down the page in the owner's order, in one column at a readable width. */}
            <div className="max-w-[56rem]">
              {main.map((block) => (
                <Section key={block.id} block={block}>
                  <BlockView block={block} />
                </Section>
              ))}
            </div>
            {main.length === 0 && !lead && (
              <EmptyPage text={uiFor(profile.locale).emptyPage} className="text-muted" />
            )}
            <Footer footer={buildFooter(profile)} />
          </main>
        </div>
      </div>
    </ThemeWrapper>
  );
}
