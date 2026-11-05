import type { ReactNode } from 'react';
import { pageLabel } from '@/lib/pages';
import { Fraunces, Nunito_Sans } from 'next/font/google';
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
import { ReadMore } from './ReadMore';
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
  InitialsBadge,
  FooterLines,
  MoreLinkView,
  PageHeading,
  CtaView,
  IdentityStrip,
} from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import { SoftPages } from './templates/SoftPages';
import { pageView } from './templates/model';
import type { ThemeProps } from './types';
import { focusRing, display } from '@/components/themes/tokens';

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

const card = 'rounded-3xl border border-line bg-surface';
const chip = 'rounded-full bg-accent-soft px-3.5 py-1 font-semibold';

// The introduction: centered, a large round photo, the name, one line, then the ways to reach the person.
// A heavy profile gets the compact one (a smaller photo and tighter spacing) so Experience is not pushed
// far down the page.
function Header({ header, compact = false }: { header: HeaderModel; compact?: boolean }) {
  const pill = `pt-small inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-semibold transition-colors duration-200 hover:bg-accent-soft ${focusRing}`;
  return (
    <header className="rise-in flex flex-col items-center text-center">
      <Avatar
        avatar={header.avatar}
        className={`shrink-0 rounded-full ring-4 ring-surface ${compact ? 'size-24' : 'size-36 sm:size-44'}`}
        placeholderClassName={`${display} bg-accent-soft font-medium text-ink ${compact ? 'pt-title' : 'text-[3.5rem]'}`}
      />
      <h1 className={`${display} pt-name font-medium ${compact ? 'pt-h1 mt-4' : 'pt-title mt-6'}`}>
        {header.name}
      </h1>
      {header.tagline && <p className="pt-body pt-measure mt-2 text-muted">{header.tagline}</p>}
      {header.location && (
        <p className="pt-small mt-3 inline-flex items-center gap-1.5 text-muted">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          <span>{header.location}</span>
        </p>
      )}
      <AvailabilityBadge
        availability={header.availability}
        ui={header.ui}
        className="pt-small mt-4 max-w-xl justify-center rounded-3xl bg-accent-soft px-4 py-2 text-start text-ink"
        dotClassName="bg-accent-fg"
        linkClassName={`font-bold text-ink underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
      {header.work && (
        <WorkCard
          work={header.work}
          className="pt-small mt-3 max-w-xl rounded-3xl bg-accent-soft px-4 py-2.5 text-start text-ink"
          linkClassName={`font-bold text-ink underline underline-offset-2 hover:no-underline ${focusRing}`}
          buttonClassName={`pt-fine rounded-full bg-ink px-3 py-1 font-bold text-page hover:opacity-90 ${focusRing}`}
        />
      )}
      <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
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
    </header>
  );
}

// A profile with this much to read gets the compact introduction.
const isHeavy = (profile: { experience: unknown[]; about?: string | null }) =>
  profile.experience.length >= 4 || (profile.about?.length ?? 0) > 700;

// Experience is the strongest section: a larger heading. Everything else is one step down.
function Section({ block, children }: { block: Block; children: ReactNode }) {
  const lead = block.kind === 'entries' && block.variant === 'experience';
  return (
    <section aria-labelledby={block.id} className="mt-12 sm:mt-16">
      <h2
        id={block.id}
        className={`${display} mb-5 font-medium text-balance ${lead ? 'pt-h1' : 'pt-h2'}`}
      >
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
          className="pt-body"
        />
      );
    case 'skills':
      return <SkillList block={block} className="flex flex-wrap gap-2.5" itemClassName={chip} />;
    case 'projects':
      return (
        <ProjectList
          block={block}
          classes={{
            list: 'grid gap-4 sm:grid-cols-2',
            item: `${card} group relative flex flex-col p-5`,
            cover: 'rounded-2xl object-cover aspect-[40/21] max-w-none',
            body: 'flex-1 text-muted',
            meta: 'text-muted',
            link: `font-semibold text-ink underline decoration-line underline-offset-4 hover:no-underline after:absolute after:inset-0 after:rounded-3xl ${focusRing}`,
          }}
        />
      );
    case 'writing':
      return (
        <WritingList
          block={block}
          className="grid gap-4"
          itemClassName={`${card} group relative flex min-w-0 flex-col p-5`}
          coverClassName="mb-5 aspect-[40/21] w-full rounded-2xl object-cover"
          titleClassName={`${display} pt-h3 font-medium`}
          linkClassName={`after:absolute after:inset-0 after:rounded-3xl ${focusRing}`}
          metaClassName="pt-small mt-1 text-muted"
          excerptClassName="pt-body mt-3 text-muted"
          moreClassName={`pt-small mt-6 inline-block font-bold text-ink underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
      );
    case 'testimonials': {
      const listTestimonials = (items: typeof block.testimonials) => (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <figure className="flex h-full flex-col rounded-3xl bg-accent-soft p-6">
                <blockquote className="pt-body pt-measure flex-1 whitespace-pre-line">
                  {item.message}
                </blockquote>
                <figcaption className="pt-small mt-5 flex items-center gap-3">
                  <InitialsBadge
                    name={item.name}
                    className={`${display} size-10 bg-surface pt-body text-ink`}
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
              buttonClassName={`pt-small mt-10 inline-flex items-center rounded-full bg-ink px-6 py-2.5 font-bold text-page transition-opacity duration-200 hover:opacity-90 ${focusRing}`}
            />
          )}
        </>
      );
    }
    case 'cta':
      return (
        <CtaView
          block={block}
          linkClassName={`pt-small inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-bold text-page transition-opacity duration-200 hover:opacity-90 ${focusRing}`}
        />
      );
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`pt-small inline-flex items-center rounded-full bg-ink px-6 py-2.5 font-bold text-page transition-opacity duration-200 hover:opacity-90 ${focusRing}`}
          />
        </div>
      );
    case 'entries': {
      // Experience sits in one hairline panel with a quiet timeline; other lists are a plain timeline.
      const experience = block.variant === 'experience';
      const list = (
        <EntryList
          block={block}
          totalClassName="inline-block rounded-full bg-accent-soft px-4 py-1 font-semibold"
          marker={
            <span
              aria-hidden="true"
              className="absolute -start-[1.9rem] top-2 size-3 rounded-full bg-accent ring-4 ring-surface"
            />
          }
          classes={{
            list: 'space-y-8 border-s-2 border-line ps-6',
            item: 'relative',
            title: `${display} font-medium ${experience ? 'pt-h2' : 'pt-h3'}`,
            org: 'text-muted',
            dates: 'mb-1 text-muted',
          }}
        />
      );
      return experience ? <div className={`${card} p-5 sm:p-8`}>{list}</div> : list;
    }
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="pt-small mx-auto max-w-3xl px-(--gutter) pb-12 text-center text-muted">
      <FooterLines
        footer={footer}
        yearClassName="mt-16"
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
        hero={<Header header={buildHeader(profile)} compact={isHeavy(profile)} />}
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
        placeholderClassName={`${display} bg-accent-soft pt-title font-medium text-ink`}
        nameClassName={`${display} pt-h2 font-medium`}
        taglineClassName="pt-body mt-1 text-muted"
        metaClassName="pt-small mt-2 text-muted"
        pillClassName={`pt-small inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-semibold transition-colors duration-200 hover:bg-accent-soft ${focusRing}`}
        badgeClassName="pt-small mt-3 max-w-xl justify-center rounded-3xl bg-accent-soft px-4 py-2 text-start text-ink sm:justify-start"
        badgeDotClassName="bg-accent-fg"
        badgeLinkClassName={`font-bold text-ink underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
    ) : null;
  return (
    <ThemeWrapper theme="soft" profile={profile} nav={nav} className={fontClass}>
      <main id={`${idPrefix}main`} className="mx-auto max-w-3xl px-(--gutter) py-8 sm:py-12">
        {lead ??
          (heading ? (
            <PageHeading
              heading={heading}
              title={page ? pageLabel(profile, page) : undefined}
              kicker={profile.fullName}
              wrapClassName="mb-2 text-center sm:mb-4"
              kickerClassName="pt-small mb-3 text-muted"
              className={`${display} pt-title pt-name font-medium`}
            />
          ) : (
            <Header header={buildHeader(profile)} compact={isHeavy(profile)} />
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
