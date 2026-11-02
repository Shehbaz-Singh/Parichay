import type { ReactNode } from 'react';
import { Fredoka, Nunito_Sans } from 'next/font/google';
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
import { uiFor } from '@/lib/i18n';
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
} from './parts';
import { Reveal } from './Reveal';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// Friendly and warm. The page is a pastel tinted from the accent (very little of it); the header
// talks ("Hi, I'm ...") beside a big round photo on a soft blob; skills are tinted pills; jobs are
// white cards with a thick colored left edge; projects are big rounded cards with a round arrow;
// testimonials are speech bubbles. Text is always the dark ink on white or on the pastel, never the
// accent, so contrast does not depend on the color the owner picked. Fredoka for headings,
// Nunito Sans for text.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const sans = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${fredoka.variable}`;

const display = 'font-(family-name:--font-theme-display)';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const card = 'rounded-[2rem] bg-surface shadow-[0_2px_0_0_var(--border)]';
const lift = 'transition duration-300 motion-safe:hover:-translate-y-1 hover:shadow-raised';

// Tints of the accent, used in turn, so a row of pills or cards is colorful without a second hue.
const TINTS = [
  'bg-[color-mix(in_srgb,var(--accent)_10%,white)]',
  'bg-[color-mix(in_srgb,var(--accent)_18%,white)]',
  'bg-[color-mix(in_srgb,var(--accent)_28%,white)]',
];
const EDGES = [
  'border-s-[color-mix(in_srgb,var(--accent)_100%,transparent)]',
  'border-s-[color-mix(in_srgb,var(--accent)_60%,white)]',
  'border-s-[color-mix(in_srgb,var(--accent)_35%,white)]',
];

function Blob() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="soft-float absolute -inset-5 -z-10 size-[calc(100%+2.5rem)] text-accent/25"
    >
      <path
        fill="currentColor"
        d="M44.7,-58.1C57.6,-48.6,67.3,-34.6,71.8,-18.9C76.3,-3.2,75.5,14.2,68.2,28.3C60.9,42.4,47.1,53.2,32,60.6C16.9,68,0.6,72,-16.1,70.1C-32.8,68.2,-49.9,60.4,-60.2,47.3C-70.5,34.2,-74,15.8,-72.2,-1.1C-70.4,-18,-63.3,-33.4,-52.2,-43.3C-41.1,-53.2,-26,-57.6,-10.5,-59.9C5,-62.2,31.8,-67.6,44.7,-58.1Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

function Header({ header }: { header: HeaderModel }) {
  const pill = `inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold transition duration-200 hover:bg-page motion-safe:hover:-translate-y-0.5 ${focusRing}`;
  return (
    <header className="rise-in flex flex-col items-center gap-8 text-center sm:flex-row sm:gap-12 sm:text-start">
      <div className="relative isolate shrink-0">
        <Blob />
        <Avatar
          avatar={header.avatar}
          className="size-40 rounded-full border-4 border-surface shadow-raised sm:size-52"
          placeholderClassName={`${display} bg-[color-mix(in_srgb,var(--accent)_28%,white)] text-6xl font-semibold text-ink sm:text-7xl`}
        />
      </div>
      <div className="min-w-0">
        <h1
          className={`${display} text-[clamp(2.25rem,7vw,4rem)] leading-[1.08] font-semibold text-balance`}
        >
          Hi, I’m {header.name}
        </h1>
        {header.tagline && (
          <p className="mt-4 text-xl leading-snug text-pretty text-muted sm:text-2xl">
            {header.tagline}
          </p>
        )}
        <AvailabilityBadge
          availability={header.availability}
          ui={header.ui}
          className="mt-5 justify-center rounded-3xl border border-line bg-accent-soft px-4 py-2.5 text-start text-sm text-ink sm:justify-start"
          dotClassName="bg-accent-fg"
          linkClassName={`font-bold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
        {header.work && (
          <WorkCard
            work={header.work}
            className="mt-4 rounded-3xl border border-line bg-accent-soft px-4 py-3 text-start text-ink"
            linkClassName={`font-bold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
            buttonClassName={`rounded-full bg-ink px-3 py-1 text-xs font-bold text-page hover:opacity-90 ${focusRing}`}
          />
        )}
        {header.location && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-1 text-sm font-semibold">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span>{header.location}</span>
          </p>
        )}
        <ul className="mt-6 flex flex-wrap justify-center gap-2.5 sm:justify-start">
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

function Section({
  block,
  animate,
  children,
}: {
  block: Block;
  animate: boolean;
  children: ReactNode;
}) {
  return (
    <Reveal enabled={animate}>
      <section aria-labelledby={block.id} className="mt-20 sm:mt-24">
        <h2
          id={block.id}
          className={`${display} mb-8 flex items-center gap-4 text-3xl font-semibold text-balance`}
        >
          <span aria-hidden="true" className="h-3 w-10 shrink-0 rounded-full bg-accent" />
          <span className="min-w-0">{block.title}</span>
        </h2>
        {children}
      </section>
    </Reveal>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'about':
      return (
        <div className={`${card} p-7 sm:p-10`}>
          <p className="text-lg leading-8 whitespace-pre-line sm:text-xl sm:leading-9">
            {block.text}
          </p>
        </div>
      );
    case 'skills':
      return (
        <ul className="flex flex-wrap gap-3">
          {block.skills.map((skill, i) => (
            <li
              key={skill.id}
              className={`rounded-full px-5 py-2 font-bold ${TINTS[i % TINTS.length]}`}
            >
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="grid gap-6 md:grid-cols-2">
          {block.projects.map((project) => (
            <li
              key={project.id}
              className={`${card} ${project.href ? lift : ''} group relative flex min-w-0 flex-col p-7`}
            >
              <h3 className={`${display} pe-14 text-2xl leading-snug font-semibold`}>
                {project.href ? (
                  <NewTabLink
                    href={project.href}
                    className={`after:absolute after:inset-0 after:rounded-[2rem] ${focusRing}`}
                  >
                    {project.name}
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.href && (
                <span
                  aria-hidden="true"
                  className="absolute end-6 top-6 flex size-11 items-center justify-center rounded-full bg-accent text-on-accent transition-transform duration-300 motion-safe:group-hover:rotate-45"
                >
                  <ArrowUpRight className="rtl:-scale-x-100 size-5" />
                </span>
              )}
              {project.description && (
                <p className="mt-3 flex-1 leading-relaxed whitespace-pre-line text-muted">
                  {project.description}
                </p>
              )}
              {project.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <li
                      key={tag}
                      className={`rounded-full px-3 py-0.5 text-sm font-semibold ${TINTS[i % TINTS.length]}`}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      );
    case 'writing':
      return (
        <WritingList
          block={block}
          className="grid gap-6 md:grid-cols-2"
          itemClassName={`${card} ${lift} group relative flex min-w-0 flex-col p-7`}
          coverClassName="mb-5 aspect-[40/21] w-full rounded-2xl object-cover"
          titleClassName={`${display} text-2xl leading-snug font-semibold`}
          linkClassName={`after:absolute after:inset-0 after:rounded-[2rem] ${focusRing}`}
          metaClassName="mt-1 text-sm font-semibold text-muted"
          excerptClassName="mt-3 leading-relaxed text-muted"
          moreClassName={`mt-6 inline-block font-bold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
      );
    case 'testimonials':
      return (
        <>
          {block.testimonials.length > 0 ? (
            <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2">
              {block.testimonials.map((item) => (
                <li key={item.id} className="min-w-0">
                  <figure className="flex h-full flex-col">
                    <div className="relative flex-1 rounded-[2rem] rounded-bl-lg border border-line bg-surface p-7">
                      <blockquote className="text-lg leading-relaxed whitespace-pre-line">
                        {item.message}
                      </blockquote>
                      {/* The bubble's tail. */}
                      <span
                        aria-hidden="true"
                        className="absolute start-6 -bottom-2.5 size-5 rotate-45 border-e border-b border-line bg-surface"
                      />
                    </div>
                    <figcaption className="mt-5 flex items-center gap-3 ps-4 text-sm">
                      <InitialsBadge
                        name={item.name}
                        className={`${display} size-11 bg-[color-mix(in_srgb,var(--accent)_28%,white)] text-base text-ink`}
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
          ) : (
            <p className="text-muted">{block.ui.noTestimonials}</p>
          )}
          {block.submitTo && (
            <LeaveTestimonial
              slug={block.submitTo}
              ui={block.ui.leave}
              buttonClassName={`mt-10 inline-flex items-center rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-page transition duration-200 hover:opacity-90 motion-safe:hover:-translate-y-0.5 ${focusRing}`}
            />
          )}
        </>
      );
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`inline-flex items-center rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-page transition duration-200 hover:opacity-90 motion-safe:hover:-translate-y-0.5 ${focusRing}`}
          />
        </div>
      );
    case 'entries':
      return (
        <>
          <TotalExperience
            total={block.total}
            label={block.ui.totalExperience}
            className="mb-5 inline-block rounded-full bg-accent-soft px-4 py-1 text-sm font-semibold"
          />
          <ol className="space-y-5">
            {block.entries.map((entry, i) => (
              <li
                key={entry.id}
                className={`${card} min-w-0 border-s-[0.625rem] p-6 sm:p-7 ${EDGES[i % EDGES.length]}`}
              >
                {entry.start && (
                  <p
                    className={`mb-3 inline-block rounded-full px-3 py-0.5 text-sm font-bold tabular-nums ${TINTS[i % TINTS.length]}`}
                  >
                    <DateRange
                      start={entry.start}
                      end={entry.end}
                      openEnded={block.variant !== 'custom'}
                      duration={entry.duration}
                      fmt={entry.fmt}
                    />
                  </p>
                )}
                <h3 className={`${display} text-xl leading-snug font-semibold sm:text-2xl`}>
                  {entry.title}
                </h3>
                {entry.subtitle && (
                  <p className="mt-0.5 font-semibold text-muted">{entry.subtitle}</p>
                )}
                {entry.roles && (
                  <RoleList
                    roles={entry.roles}
                    className="mt-4 space-y-4 border-s-2 border-line ps-4"
                    titleClassName={`${display} text-lg font-semibold`}
                    datesClassName="text-sm font-semibold text-muted tabular-nums"
                    descriptionClassName="mt-1 leading-relaxed"
                  />
                )}
                {entry.description && (
                  <p className="mt-3 leading-relaxed whitespace-pre-line">{entry.description}</p>
                )}
                {entry.href && (
                  <p className="mt-4">
                    <NewTabLink
                      href={entry.href}
                      context={entry.title}
                      className={`inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4 hover:no-underline ${focusRing}`}
                    >
                      View
                      <ArrowUpRight aria-hidden="true" className="rtl:-scale-x-100 size-4" />
                    </NewTabLink>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </>
      );
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mx-auto max-w-4xl px-5 pb-12 text-center text-sm text-muted sm:px-8">
      <p className="mt-24">
        © {footer.year} {footer.name}
      </p>
      <p className="mt-1">
        Made {footer.message}{' '}
        <a
          href={footer.cta.href}
          className={`font-bold text-ink underline underline-offset-4 hover:no-underline ${focusRing}`}
        >
          {footer.cta.label}
        </a>
      </p>
    </footer>
  );
}

export default function SoftTheme({ profile, idPrefix = '' }: ThemeProps) {
  const blocks = buildBlocks(profile, idPrefix);
  return (
    <ThemeWrapper theme="soft" profile={profile} className={fontClass}>
      <main id={`${idPrefix}main`} className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
        <Header header={buildHeader(profile)} />
        {blocks.map((block) => (
          <Section key={block.id} block={block} animate={!idPrefix}>
            <BlockView block={block} />
          </Section>
        ))}
        {blocks.length === 0 && (
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
