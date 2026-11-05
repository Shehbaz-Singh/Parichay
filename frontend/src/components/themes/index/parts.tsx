import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AVATAR_SHAPE_CLASS } from '../avatar-shape';
import { formatDate } from '@/lib/format';
import { fill } from '@/lib/i18n';
import type { Block, Entry, HeaderModel, ProjectEntry } from '../blocks';
import { Collapse } from '../Collapse';
import { ContactForm } from '../ContactForm';
import { ReadMore } from '../ReadMore';
import { AvailabilityBadge, DateRange, HeaderLink, NewTabLink } from '../parts';
import { ShareButton } from '../../ShareButton';
import { WorkCard } from '../WorkCard';
import {
  Bullets,
  Footer as KitFooter,
  ProjectGrid,
  RuledSection,
  SplitExperienceItem,
  focusRing,
  pageGutter,
  splitGrid,
  textLink,
  wrap,
} from '../kit';
import { HERO_NAME, bulletsOf, nameScale } from './model';

// The pieces of the Index theme, for the single page and the pages of a multi-page portfolio. Everything is
// ruled, not boxed: hairlines, whitespace, size and weight make the hierarchy. No cards, shadows, icons,
// chips or hover effects.

export { focusRing, wrap };
export const gutter = pageGutter;
// The asymmetric grid of the kit: a label column and a text column of about 66 characters.
export const grid2 = splitGrid;
const titleClass = `ix-tight scroll-mt-20 min-[900px]:scroll-mt-10 text-[clamp(2.5rem,3.6vw,3.5rem)] leading-[1.1] font-medium outline-none ${wrap}`;
const bodyText = 'text-[1.0625rem] leading-[1.65]';
const small = 'text-[0.875rem] leading-snug';
export const labelClass = 'text-[0.8125rem] leading-snug font-semibold';
const link = textLink;

export const primaryButton = `inline-flex min-h-12 max-w-full items-center bg-ink px-6 py-3 text-[0.9375rem] font-medium text-page hover:bg-ink/85 ${focusRing}`;
export const outlineButton = `inline-flex min-h-12 max-w-full items-center border border-ink px-6 py-3 text-[0.9375rem] font-medium hover:bg-ink hover:text-page ${focusRing}`;
const textButton = `inline-flex min-h-10 items-center text-[0.9375rem] font-medium ${link}`;

// A section: the large numbered title on the left and the text in the narrow column (the kit's
// RuledSection). `stack` puts the title above and gives the content the whole width (jobs and work).
export function Section({
  id,
  number,
  title,
  layout = 'split',
  aside,
  children,
}: {
  id: string;
  number?: string;
  title: string;
  layout?: 'split' | 'stack';
  aside?: ReactNode; // under the title in the left column (a photo); wide screens only
  children: ReactNode;
}) {
  return (
    <RuledSection
      id={id}
      number={number}
      title={title}
      layout={layout}
      aside={aside}
      titleClassName={titleClass}
    >
      {children}
    </RuledSection>
  );
}

// ---- The hero: a soft gradient with the name, the role, one line and two actions, centered.

export interface Action {
  href: string;
  label: string;
  download?: boolean;
}

export function Hero({
  header,
  id,
  line,
  primary,
  secondary,
}: {
  header: HeaderModel;
  id: string;
  line: string | null;
  primary: Action | null;
  secondary: Action | null;
}) {
  const heroButton = `inline-flex min-h-12 max-w-full items-center px-6 py-3 text-[0.9375rem] font-medium ${focusRing}`;
  const act = (action: Action, solid: boolean) => {
    const className = solid
      ? `${heroButton} bg-(--ix-hero-ink) text-(--ix-hero-page) hover:opacity-90`
      : `${heroButton} border border-current hover:bg-(--ix-hero-ink) hover:text-(--ix-hero-page)`;
    // A file, a mail link and an anchor are plain links; only a page of the site goes through the router.
    return action.download || /^(#|mailto:|tel:)/.test(action.href) ? (
      <a href={action.href} className={className} {...(action.download ? { download: true } : {})}>
        {action.label}
      </a>
    ) : (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  };
  return (
    <div
      role="region"
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-name`}
      className="ix-hero flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-[clamp(1.25rem,4vw,3rem)] py-16 text-center outline-none min-[900px]:min-h-[90svh]"
    >
      <div className="ix-hero-content mx-auto flex w-full max-w-5xl flex-col items-center py-6">
        <h1
          id={`${id}-name`}
          className={`ix-tight ${HERO_NAME[nameScale(header.name)]} max-w-full text-balance leading-[1.08] font-medium [hyphens:none] ${wrap}`}
        >
          {header.name}
        </h1>
        {header.tagline && (
          <p
            className={`ix-lead mt-5 max-w-[34ch] text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.3] text-balance ${wrap}`}
          >
            {header.tagline}
          </p>
        )}
        {line && <p className={`mt-4 max-w-[48ch] ${bodyText} text-pretty ${wrap}`}>{line}</p>}
        {(primary || secondary) && (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 print:hidden">
            {primary && act(primary, true)}
            {secondary && act(secondary, false)}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Below the hero: the page title and summary, then the numbered contents.

export function Intro({
  header,
  id,
  summary,
  children,
}: {
  header: HeaderModel;
  id: string;
  summary: string | null;
  children?: ReactNode;
}) {
  const ui = header.ui;
  const first = header.name.trim().split(/\s+/)[0] ?? header.name;
  return (
    <div role="region" aria-labelledby={id} className={gutter}>
      <div className={`${grid2} py-[clamp(3rem,7vw,6.5rem)]`}>
        <h2 id={id} className={`${titleClass} min-w-0`}>
          {ui.sidebar.hi} {first}
        </h2>
        <div className="min-w-0 space-y-8">
          {summary && (
            <div className={`${bodyText} max-w-[66ch] space-y-5 ${wrap}`}>
              {summary.split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <Details header={header} />
          {children}
        </div>
      </div>
    </div>
  );
}

// The small things of the intro: availability, share, add to contacts. Quiet text, not buttons.
function Details({ header }: { header: HeaderModel }) {
  const ui = header.ui;
  if (!header.availability && !header.contact && !header.share) return null;
  return (
    <div className="space-y-4">
      <AvailabilityBadge
        availability={header.availability}
        ui={ui}
        className={`${small} text-ink`}
        dotClassName="bg-accent-fg"
        linkClassName={`font-semibold ${link}`}
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 print:hidden">
        <ShareButton {...header.share} ui={ui.share} variant="outline" className="ix-share" />
        {header.contact && (
          <a
            href={header.contact.href}
            download
            title={header.contact.hint}
            aria-describedby="contact-card-hint"
            className={textButton}
          >
            {header.contact.label}
          </a>
        )}
        {header.contact && (
          <span id="contact-card-hint" className="sr-only">
            {header.contact.hint}. {header.contact.help}
          </span>
        )}
      </div>
    </div>
  );
}

// "01 Experience": each links to its section (or its page).
export function Contents({
  items,
  label,
}: {
  items: { href: string; label: string; number: string }[];
  label: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={label} className={gutter}>
      <div className={`${grid2} items-baseline border-t border-line py-[clamp(2.5rem,5vw,4.5rem)]`}>
        <p aria-hidden="true" className={`${labelClass} min-w-0`}>
          {label}
        </p>
        <nav aria-label={label} className="min-w-0">
          <ol>
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`flex items-baseline gap-4 py-[0.2em] text-[clamp(1.35rem,2vw,1.6rem)] leading-snug hover:underline hover:underline-offset-6 ${wrap} ${focusRing}`}
                >
                  <span
                    aria-hidden="true"
                    className="w-8 shrink-0 text-[0.9em] text-muted tabular-nums"
                  >
                    {item.number}
                  </span>
                  <span className="min-w-0">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}

// ---- Experience: the kit's SplitExperienceItem (company and title left, dates under, bullets right).

const roleTitle = 'ix-tight text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.15] font-medium';

export function Roles({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  const list = (items: Entry[]) => (
    <ol>
      {items.map((entry) => (
        <SplitExperienceItem
          key={entry.id}
          entry={entry}
          ui={block.ui}
          titleClassName={roleTitle}
        />
      ))}
    </ol>
  );
  return (
    <>
      {block.total && (
        <p className={`${small} mb-6 text-muted`}>
          {block.ui.totalExperience}: <span className="font-semibold text-ink">{block.total}</span>
        </p>
      )}
      {list(block.entries)}
      {block.rest.length > 0 && (
        <Collapse
          className="border-t border-line pt-6"
          label={fill(block.ui.density.earlierRoles, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
          buttonClassName={`min-h-10 text-[1.0625rem] font-medium print:hidden ${link}`}
        >
          <div className="mt-4">{list(block.rest)}</div>
        </Collapse>
      )}
    </>
  );
}

// ---- Selected work: the kit's ProjectGrid.

export function WorkGrid({ projects }: { projects: ProjectEntry[] }) {
  return (
    <ProjectGrid
      projects={projects}
      titleClassName="ix-tight text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.1] font-medium"
    />
  );
}

export function MoreWork({ href, label }: { href: string; label: string }) {
  return (
    <p className="mt-[clamp(2.5rem,5vw,4rem)] print:hidden">
      <Link
        href={href}
        className={`inline-flex min-h-10 items-center gap-2 text-[1.0625rem] font-medium ${link}`}
      >
        {label}
        <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      </Link>
    </p>
  );
}

// ---- About: the text in the narrow column, a photo beside it, the facts in small labeled pairs.

export function Photo({ avatar }: { avatar: HeaderModel['avatar'] }) {
  if (!avatar.src) return null;
  return (
    <img
      src={avatar.src}
      alt={avatar.alt}
      width={400}
      height={avatar.shape ? 400 : 500}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={
        avatar.shape
          ? `aspect-square w-full max-w-[22rem] object-cover ${AVATAR_SHAPE_CLASS[avatar.shape]}`
          : 'aspect-[4/5] w-full max-w-[22rem] object-cover object-[50%_28%]'
      }
    />
  );
}

export function Facts({
  facts,
  label,
}: {
  facts: { label: string; value: string }[];
  label: string;
}) {
  if (facts.length === 0) return null;
  return (
    <dl aria-label={label} className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className={labelClass}>{fact.label}</dt>
          <dd className={`mt-1 ${wrap}`}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AboutText({
  text,
  locale,
  full = false,
}: {
  text: string;
  locale: string;
  full?: boolean;
}) {
  return (
    <ReadMore
      text={text}
      locale={locale}
      from={full ? 100000 : 900}
      lines={9}
      className={`${bodyText} !max-w-[66ch] ${wrap}`}
    />
  );
}

export function WorkingTogether({ work }: { work: NonNullable<HeaderModel['work']> }) {
  return (
    <WorkCard
      work={work}
      className="ix-panel border border-line bg-(--panel) p-5 text-start text-ink"
      linkClassName={`font-semibold ${link}`}
      buttonClassName={`bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-page hover:bg-ink/85 ${focusRing}`}
    />
  );
}

// ---- Skills: plain text in columns.

export function SkillsList({ block }: { block: Extract<Block, { kind: 'skills' }> }) {
  const list = (items: typeof block.skills) => (
    <ul className={`${bodyText} columns-2 gap-x-8 [&>li]:break-inside-avoid`}>
      {items.map((skill) => (
        <li key={skill.id} className={`py-1 ${wrap}`}>
          {skill.name}
        </li>
      ))}
    </ul>
  );
  return (
    <>
      {list(block.skills)}
      {block.rest.length > 0 && (
        <Collapse
          className="mt-4"
          label={fill(block.ui.density.moreSkills, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
          buttonClassName={`min-h-10 text-[1.0625rem] font-medium print:hidden ${link}`}
        >
          <div className="mt-2">{list(block.rest)}</div>
        </Collapse>
      )}
    </>
  );
}

// ---- Education and custom sections: a ruled list.

export function Ruled({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  return (
    <ul>
      {block.entries.map((entry) => (
        <li key={entry.id} className="border-t border-line py-6 first:border-t-0 first:pt-0">
          <h3 className={`text-[1.0625rem] leading-snug font-semibold ${wrap}`}>
            {entry.href ? (
              <NewTabLink href={entry.href} className={link}>
                {entry.title}
              </NewTabLink>
            ) : (
              entry.title
            )}
          </h3>
          {entry.subtitle && <p className={`mt-0.5 ${wrap}`}>{entry.subtitle}</p>}
          {entry.start && (
            <p className={`mt-1 ${small} text-muted tabular-nums`}>
              <DateRange start={entry.start} end={entry.end} fmt={entry.fmt} />
            </p>
          )}
          {entry.description && (
            <div className="mt-3">
              <Bullets pieces={bulletsOf(entry.description)} ui={block.ui} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// ---- Writing: titles and dates on rules.

export function WritingRuled({ block }: { block: Extract<Block, { kind: 'writing' }> }) {
  return (
    <>
      <ul>
        {block.posts.map((post) => {
          const title = post.external ? (
            <NewTabLink
              href={post.href}
              className={`hover:underline hover:underline-offset-4 ${focusRing}`}
            >
              {post.title}
            </NewTabLink>
          ) : (
            <Link
              href={post.href}
              className={`hover:underline hover:underline-offset-4 ${focusRing}`}
            >
              {post.title}
            </Link>
          );
          return (
            <li
              key={post.id}
              className="grid gap-x-6 gap-y-1 border-t border-line py-5 first:border-t-0 first:pt-0 sm:grid-cols-[1fr_auto]"
            >
              <h3 className={`text-[1.0625rem] leading-snug font-semibold ${wrap}`}>
                {title}
                {post.external && (
                  <span className={`ms-2 ${small} font-normal text-muted`}>
                    {block.ui.linkBadge}
                  </span>
                )}
              </h3>
              <p className={`${small} text-muted tabular-nums`}>
                <time dateTime={post.date}>{formatDate(post.date, block.locale)}</time>
              </p>
            </li>
          );
        })}
      </ul>
      {block.more && <MoreWork href={block.allHref} label={block.ui.viewAll} />}
    </>
  );
}

// ---- Testimonials: a quiet large quote on a pale panel.

export function Quote({
  quote,
}: {
  quote: { id: string; name: string; detail: string | null; message: string };
}) {
  return (
    <figure className="ix-panel bg-(--panel) p-[clamp(1.5rem,3vw,2.5rem)]">
      <blockquote
        className={`text-[clamp(1.25rem,2vw,1.5rem)] leading-[1.4] whitespace-pre-line ${wrap}`}
      >
        {quote.message}
      </blockquote>
      <figcaption className="mt-5 text-[0.9375rem] leading-snug">
        <span className="font-semibold">{quote.name}</span>
        {quote.detail && <span className="mt-0.5 block text-muted">{quote.detail}</span>}
      </figcaption>
    </figure>
  );
}

// ---- Contact: the details set large, the elsewhere links, the form.

// The address or the number itself, not the owner's label for the link ("Email").
function detailText(item: HeaderModel['links'][number]): string {
  try {
    if (item.type === 'email')
      return decodeURIComponent(item.href.replace(/^mailto:/i, '').split('?')[0]);
    if (item.type === 'phone') return decodeURIComponent(item.href.replace(/^tel:/i, ''));
  } catch {
    // a malformed escape: the label is still right
  }
  return item.label;
}

export function ContactBody({
  header,
  form,
  work,
  intro,
}: {
  header: HeaderModel;
  form: ReactNode | null;
  work?: ReactNode;
  intro?: string | null;
}) {
  const ui = header.ui;
  const details = header.links.filter((item) => item.type === 'email' || item.type === 'phone');
  const elsewhere = header.links.filter((item) => item.type !== 'email' && item.type !== 'phone');
  return (
    <div className="min-w-0 space-y-[clamp(2rem,4vw,3.5rem)]">
      {intro && <p className={`${bodyText} max-w-[48ch] ${wrap}`}>{intro}</p>}
      {details.length > 0 && (
        <ul className="space-y-2">
          {details.map((item) => (
            <li key={item.id} className="min-w-0">
              <a
                href={item.href}
                className={`ix-tight inline-block text-[clamp(1.4rem,2.6vw,2.1rem)] leading-snug font-medium ${link} ${wrap}`}
              >
                {detailText(item)}
              </a>
            </li>
          ))}
        </ul>
      )}
      {elsewhere.length > 0 && (
        <div>
          <p className={`${labelClass} mb-3`}>{ui.pages.links}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {elsewhere.map((item) => (
              <li key={item.id} className="min-w-0">
                <HeaderLink
                  link={item}
                  className={`inline-flex min-h-9 items-center ${bodyText} ${link} ${wrap} [&>span:first-child]:hidden`}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {work}
      {form && (
        <div className="min-w-0 border-t border-line pt-[clamp(2rem,4vw,3.5rem)] print:hidden">
          {form}
        </div>
      )}
    </div>
  );
}

export function FormView({
  form,
  state,
}: {
  form: Parameters<typeof ContactForm>[0]['form'];
  state?: Parameters<typeof ContactForm>[0]['page'];
}) {
  return <ContactForm form={form} page={state} buttonClassName={primaryButton} />;
}

// ---- The footer: the kit's Footer, the name in this theme's serif.

export function Footer(props: Omit<Parameters<typeof KitFooter>[0], 'nameClassName'>) {
  return <KitFooter {...props} nameClassName="ix-tight font-(family-name:--font-theme-display)" />;
}
