import type { ReactNode } from 'react';
import { pageLabel } from '@/lib/pages';
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
  IdentityStrip,
} from './parts';
import { EditorialPages } from './templates/EditorialPages';
import { pageView } from './templates/model';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';
import { editorialLink as link, focusRing, display } from '@/components/themes/tokens';

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

const caps = 'pt-label';

// One narrow column. The label is small capitals with a short accent rule that draws in as it enters.
function Section({ block, children }: { block: Block; children: ReactNode }) {
  return (
    <section aria-labelledby={block.id} className="mt-16 sm:mt-20">
      <h2 id={block.id} className={`${caps} mb-6 flex items-center gap-4`}>
        <span aria-hidden="true" className="fx-rule h-px w-8 shrink-0 bg-accent" />
        <span className="min-w-0">{block.title}</span>
        <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line" />
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

// The masthead: a place line between two rules, a large serif name, a line about the work, and the links
// between two more.
function Masthead({ header }: { header: HeaderModel }) {
  return (
    <header className="rise-in">
      <div className="border-y border-ink py-3">
        <p className={`${caps} flex items-center gap-1.5 text-muted`}>
          {header.location && (
            <>
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{header.location}</span>
            </>
          )}
        </p>
      </div>
      <Avatar
        avatar={header.avatar}
        className="mt-10 size-24 rounded-full"
        placeholderClassName={`${display} border border-ink pt-title text-ink`}
      />
      <h1 className={`${display} pt-display pt-name mt-8 font-medium`}>{header.name}</h1>
      {header.tagline && (
        <p className={`${display} pt-h2 pt-measure mt-5 font-normal text-muted italic`}>
          {header.tagline}
        </p>
      )}
      <AvailabilityBadge
        availability={header.availability}
        ui={header.ui}
        className="pt-small mt-6 w-fit border border-line px-4 py-2.5 text-start text-ink"
        dotClassName="bg-accent-fg"
        linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
      {header.work && (
        <WorkCard
          work={header.work}
          className="pt-small mt-4 w-full max-w-sm border border-line px-4 py-3 text-start text-ink"
          linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          buttonClassName={`pt-small font-medium text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
      )}
      <ul className="pt-small mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
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
      // The drop cap is the one flourish; it is turned off for scripts where letters join (globals.css).
      return (
        <p
          className={`${display} pt-measure whitespace-pre-line first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:text-[3.6em] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-accent-fg`}
        >
          {block.text}
        </p>
      );
    case 'skills':
      // Reads as one sentence: the items are inline.
      return (
        <SkillList
          block={block}
          className={`${display} pt-body pt-measure leading-9`}
          itemClassName="inline after:content-[',_'] last:after:content-['.']"
        />
      );
    case 'projects':
      // Text, not cards: the cover images are left to the project's own page.
      return (
        <ProjectList
          block={block}
          classes={{
            list: 'space-y-10',
            title: `${display} pt-h2 font-medium`,
            link: `ed-underline text-ink ${focusRing}`,
            cover: 'hidden',
            meta: `${display} text-muted italic`,
          }}
        />
      );
    case 'writing':
      return (
        <WritingList
          block={block}
          className="space-y-10"
          itemClassName="ed-hover group relative min-w-0"
          coverClassName="hidden"
          titleClassName={`${display} pt-h2 font-medium`}
          linkClassName={`after:absolute after:inset-0 ${focusRing}`}
          metaClassName={`${display} pt-small mt-2 text-muted italic`}
          excerptClassName="pt-body pt-measure mt-3"
          moreClassName={`pt-small mt-8 inline-block text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
      );
    case 'testimonials': {
      const listTestimonials = (items: typeof block.testimonials) => (
        <ul className="space-y-12">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <figure>
                <span
                  aria-hidden="true"
                  className={`${display} block h-10 text-[4em] leading-[0.9] text-accent-fg`}
                >
                  “
                </span>
                <blockquote
                  className={`${display} pt-h3 pt-measure font-normal whitespace-pre-line italic`}
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
            <LeaveTestimonial
              slug={block.submitTo}
              ui={block.ui.leave}
              buttonClassName={`pt-small mt-8 inline-flex items-center font-medium ${link}`}
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
            buttonClassName={`pt-small inline-flex items-center font-medium ${link}`}
          />
        </div>
      );
    case 'entries': {
      // Experience is the strongest section: its titles are a step larger, with the dates hanging left.
      const lead = block.variant === 'experience';
      return (
        <EntryList
          block={block}
          hang
          totalClassName="text-muted"
          classes={{
            list: 'divide-y divide-line border-y border-line',
            item: 'py-7',
            title: `${display} font-medium ${lead ? 'pt-h2' : 'pt-h3'}`,
            org: `${display} pt-h3 font-normal text-muted italic`,
            dates: 'text-muted',
          }}
        />
      );
    }
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mx-auto max-w-[46rem] px-(--gutter) pb-12">
      <div className={`${display} pt-small mt-20 border-t border-ink pt-6 text-muted italic`}>
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
        placeholderClassName={`${display} bg-surface pt-title text-ink`}
        nameClassName={`${display} pt-h2 font-medium`}
        taglineClassName="pt-h3 mt-1 text-muted italic"
        metaClassName="pt-small mt-1 text-muted"
        pillClassName={`pt-small inline-flex items-center gap-2 border-b border-ink pb-0.5 hover:border-b-2 ${focusRing}`}
        badgeClassName="pt-small mt-3 text-ink"
        badgeDotClassName="bg-accent-fg"
        badgeLinkClassName={`font-medium text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
    ) : null;
  return (
    <ThemeWrapper theme="editorial" profile={profile} nav={nav} className={fontClass}>
      <main id={`${idPrefix}main`} className="mx-auto max-w-[46rem] px-(--gutter) py-10 sm:py-16">
        {lead ??
          (heading ? (
            <PageHeading
              heading={heading}
              title={page ? pageLabel(profile, page) : undefined}
              kicker={profile.fullName}
              wrapClassName="mb-10 border-b border-ink pb-8 sm:mb-14"
              kickerClassName={`${display} pt-h3 mb-3 text-muted italic`}
              className={`${display} pt-display pt-name font-medium`}
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
            className={`${display} mt-16 text-muted italic`}
          />
        )}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}
