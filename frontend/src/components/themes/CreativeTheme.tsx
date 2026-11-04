import type { ReactNode } from 'react';
import { pageLabel } from '@/lib/pages';
import { Bricolage_Grotesque, Space_Mono } from 'next/font/google';
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
import { EntryList, ProjectList, SkillList } from './kit';
import { ReadMore } from './ReadMore';
import { Expander } from './kit';
import { fill } from '@/lib/i18n';
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
  MoreLinkView,
  PageHeading,
  CtaView,
  IdentityStrip,
} from './parts';
import { CreativePages } from './templates/CreativePages';
import { pageView } from './templates/model';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// Bold and expressive. The one big idea: every section hangs off a huge outlined number that stays
// in view while its content scrolls past (stacked above the title on a phone), under a header in
// the accent color whose bottom edge is cut on a slant. Oversized type, hard borders, offset
// shadows that shift on hover. Bricolage Grotesque for everything, Space Mono for dates and tags.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-theme-mono',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${display.className} ${mono.variable}`;

const monoText = 'font-(family-name:--font-theme-mono)';
// The one hover motion: the card lifts toward the top left as its offset shadow grows.
const shifts =
  'transition-all duration-200 focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-[9px_9px_0_0_var(--accent)] motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--accent)]';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

function Header({ header }: { header: HeaderModel }) {
  const pill = `pt-small inline-flex max-w-full items-center gap-2 rounded-full border-2 border-current px-4 py-2 font-bold transition hover:bg-on-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent motion-safe:hover:-translate-y-0.5`;
  return (
    <header className="cr-hdr rise-in relative text-on-accent [--accent-fg:var(--on-accent)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-(--gutter) pt-12 pb-24 sm:pt-16 sm:pb-28 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {header.location && (
            <p className="pt-small mb-5 inline-flex max-w-full items-center gap-1.5 rounded-full border-2 border-current px-3 py-1 font-bold">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              {header.location}
            </p>
          )}
          <h1 className="pt-display pt-name font-extrabold tracking-tight">{header.name}</h1>
          {header.tagline && <p className="pt-h2 pt-measure mt-5 font-medium">{header.tagline}</p>}
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="pt-small mt-6 w-fit rounded-2xl border-2 border-current bg-on-accent px-4 py-2.5 font-bold text-accent"
            dotClassName="bg-accent"
            linkClassName="underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          {header.work && (
            <WorkCard
              work={header.work}
              className="pt-small mt-4 w-full max-w-sm rounded-2xl border-2 border-current bg-on-accent px-4 py-3 font-bold text-accent"
              linkClassName={`underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`pt-fine rounded-full border-2 border-current px-3 py-1 font-bold hover:bg-accent hover:text-on-accent ${focusRing}`}
            />
          )}
          <ul className="mt-8 flex flex-wrap gap-3">
            {header.links.map((link) => (
              <li key={link.id} className="max-w-full">
                <HeaderLink link={link} className={pill} />
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
              <ShareButton {...header.share} ui={header.ui.share} variant="inverse" />
            </li>
          </ul>
        </div>
        <Avatar
          avatar={header.avatar}
          className="size-36 shrink-0 rounded-[2rem] border-4 border-current sm:size-52"
          placeholderClassName="bg-on-accent pt-display font-extrabold text-accent"
        />
      </div>
      {/* The slanted edge: a page-colored wedge laid over the bottom, so nothing is clipped (the
          share menu opens over it). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-11 bg-page [clip-path:polygon(0_100%,100%_100%,100%_0)] sm:h-[4.25rem]"
      />
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
        <ReadMore
          text={block.text}
          locale={block.locale}
          from={900}
          lines={9}
          className="pt-h3 font-medium"
        />
      );
    case 'skills':
      return (
        <SkillList
          block={block}
          className="flex flex-wrap gap-2.5"
          itemClassName="rounded-full border-2 border-ink px-4 py-1.5 font-bold transition hover:bg-accent hover:text-on-accent motion-safe:hover:-translate-y-0.5"
        />
      );
    case 'projects':
      return (
        <ProjectList
          block={block}
          classes={{
            list: 'grid gap-6 lg:grid-cols-2',
            item: `${shifts} group relative flex flex-col rounded-2xl border-2 border-ink bg-page p-6 shadow-[6px_6px_0_0_var(--accent)]`,
            title: 'font-extrabold',
            cover: 'rounded-lg border-2 border-ink object-cover aspect-[40/21] max-w-none',
            body: 'text-muted',
            meta: `${monoText} font-bold text-muted`,
            link: `font-extrabold underline underline-offset-4 hover:no-underline after:absolute after:inset-0 after:rounded-2xl ${focusRing}`,
          }}
        />
      );
    case 'writing':
      return (
        <WritingList
          block={block}
          className="grid gap-6 lg:grid-cols-2"
          itemClassName={`${shifts} group relative flex min-w-0 flex-col rounded-2xl border-2 border-ink bg-page p-6 shadow-[6px_6px_0_0_var(--accent)]`}
          coverClassName="mb-4 aspect-[40/21] w-full rounded-xl border-2 border-ink object-cover"
          titleClassName="pt-h2 font-extrabold"
          linkClassName={`after:absolute after:inset-0 after:rounded-2xl ${focusRing}`}
          metaClassName={`${monoText} pt-fine mt-2 font-bold text-muted`}
          excerptClassName="pt-body mt-3 text-muted"
          moreClassName={`pt-h3 mt-8 inline-block font-extrabold underline decoration-4 decoration-accent underline-offset-4 ${focusRing}`}
        />
      );
    case 'testimonials': {
      const listTestimonials = (items: typeof block.testimonials) => (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <figure className="flex h-full flex-col rounded-2xl border-2 border-ink bg-accent-soft p-6 shadow-[6px_6px_0_0_var(--text)]">
                <span
                  aria-hidden="true"
                  className="block h-10 pt-display leading-[0.8] font-extrabold text-accent-fg"
                >
                  “
                </span>
                <blockquote className="pt-body pt-measure mt-2 flex-1 font-medium whitespace-pre-line">
                  {item.message}
                </blockquote>
                <figcaption className="mt-5">
                  <span className="block font-extrabold">{item.name}</span>
                  {item.detail && <span className="font-medium text-muted">{item.detail}</span>}
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
              buttonClassName={`pt-small inline-flex items-center rounded-full border-2 border-ink px-5 py-2 font-bold transition hover:bg-ink hover:text-page motion-safe:hover:-translate-y-0.5 ${focusRing}`}
            />
          )}
        </>
      );
    }
    case 'cta':
      return (
        <CtaView
          block={block}
          linkClassName={`pt-small inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-2 font-bold text-page transition motion-safe:hover:-translate-y-0.5 ${focusRing}`}
        />
      );
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`pt-small inline-flex items-center rounded-full border-2 border-ink px-5 py-2 font-bold transition hover:bg-ink hover:text-page motion-safe:hover:-translate-y-0.5 ${focusRing}`}
          />
        </div>
      );
    case 'entries': {
      // Experience is the strongest section: its titles are a step larger.
      const lead = block.variant === 'experience';
      return (
        <EntryList
          block={block}
          totalClassName="font-bold"
          classes={{
            list: 'space-y-8',
            item: 'border-s-4 border-accent ps-5',
            title: `font-extrabold ${lead ? 'pt-h1' : 'pt-h2'}`,
            org: 'text-muted',
            dates: `${monoText} bg-ink px-2 py-0.5 font-bold text-page`,
          }}
        />
      );
    }
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="bg-ink text-page">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-(--gutter) py-12 md:flex-row md:items-end md:justify-between">
        <p className="pt-h1 max-w-md font-extrabold">Made {footer.message}</p>
        <div className="pt-small font-medium">
          <p className="opacity-80">
            © {footer.year} {footer.name}
          </p>
          <a
            href={footer.cta.href}
            className="mt-1 inline-block font-bold underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page"
          >
            {footer.cta.label}{' '}
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
              →
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function CreativeTheme({
  profile,
  idPrefix = '',
  page,
  nav,
  heading,
  lead,
  project,
  contact,
}: ThemeProps) {
  // A multi-page portfolio (and a project page in either mode) is drawn by the page templates.
  const view = pageView(profile, { page, project, contact });
  if (view) {
    return (
      <CreativePages
        profile={profile}
        view={view}
        nav={nav}
        idPrefix={idPrefix}
        fontClass={fontClass}
        hero={<Header header={buildHeader(profile)} />}
        footer={<Footer footer={buildFooter(profile)} />}
        renderBlock={(block) => <BlockView block={block} />}
      />
    );
  }
  const blocks = buildBlocks(profile, idPrefix, page);
  const identity =
    heading && !lead && page && (page.key === 'work' || page.key === 'about') ? (
      <IdentityStrip
        header={buildHeader(profile)}
        full={page.key === 'about'}
        wrapClassName="mt-8 flex items-center gap-5 border-b-4 border-ink pb-8"
        avatarClassName="size-20 shrink-0 rounded-2xl border-2 border-ink sm:size-28"
        placeholderClassName={`bg-accent-soft pt-title font-extrabold text-ink`}
        nameClassName={`pt-h2 font-extrabold`}
        taglineClassName="pt-body mt-1 font-bold text-muted"
        metaClassName="pt-small mt-1 font-bold text-muted"
        pillClassName={`pt-small inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 font-bold transition hover:bg-ink hover:text-page ${focusRing}`}
        badgeClassName="pt-small mt-3 font-bold"
        badgeDotClassName="bg-accent"
        badgeLinkClassName={`font-extrabold underline underline-offset-4 hover:no-underline ${focusRing}`}
      />
    ) : null;
  const inner = !!heading || !!lead;
  return (
    <ThemeWrapper theme="creative" profile={profile} nav={nav} className={fontClass}>
      {!inner && <Header header={buildHeader(profile)} />}
      <main
        id={`${idPrefix}main`}
        className={`mx-auto max-w-5xl px-(--gutter) pb-20 ${inner ? 'pt-6' : ''}`}
      >
        {lead ??
          (heading && (
            <PageHeading
              heading={heading}
              title={page ? pageLabel(profile, page) : undefined}
              kicker={profile.fullName}
              wrapClassName="border-b-4 border-ink py-10 sm:py-14"
              kickerClassName={`pt-small mb-3 inline-block rounded-md bg-accent-soft px-2 py-0.5 font-extrabold text-accent-fg`}
              className={`pt-display pt-name font-extrabold tracking-tight`}
            />
          ))}
        {identity}
        {blocks.map((block) => (
          <ThemeSection key={block.id} block={block} />
        ))}
        {blocks.length === 0 && !lead && (
          <EmptyPage
            text={uiFor(profile.locale).emptyPage}
            className="pt-h1 py-16 font-extrabold"
          />
        )}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}

// The big outlined number is this theme's one signature. It is purely decorative (aria-hidden), set in a
// faint outline so it never competes with the words, and it says how many roles or projects there are.
function ThemeSection({ block }: { block: Block }): ReactNode {
  const count =
    block.kind === 'projects'
      ? block.total
      : block.kind === 'entries' && block.variant === 'experience'
        ? block.entries.length + block.rest.length
        : null;
  const lead = block.kind === 'entries' && block.variant === 'experience';
  return (
    <section
      aria-labelledby={block.id}
      className="grid gap-6 border-t-4 border-ink py-12 first:border-t-0 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10"
    >
      <div className="min-w-0 md:sticky md:top-[calc(2rem+var(--nav-h,0px))] md:self-start">
        {count !== null && (
          <span
            aria-hidden="true"
            className="pt-display block leading-none font-extrabold text-transparent opacity-40 [-webkit-text-stroke:1.5px_var(--text)]"
          >
            {String(count).padStart(2, '0')}
          </span>
        )}
        <h2 id={block.id} className={`mt-2 font-extrabold [overflow-wrap:break-word] ${lead ? 'pt-h1' : 'pt-h2'}`}>
          {block.title}
        </h2>
      </div>
      <div className="min-w-0">
        <BlockView block={block} />
      </div>
    </section>
  );
}
