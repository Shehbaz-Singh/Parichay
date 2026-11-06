import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Minus, Plus } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { fill } from '@/lib/i18n';
import type { Block, Entry, HeaderModel, ProjectEntry, WritingEntry } from '../blocks';
import { Collapse } from '../Collapse';
import { ContactForm } from '../ContactForm';
import { ReadMore } from '../ReadMore';
import {
  Avatar,
  AvailabilityBadge,
  ContactLink,
  DateRange,
  HeaderLink,
  NewTabLink,
  ProjectCover,
  ResumeLink,
  RoleList,
  LINK_ICONS,
} from '../parts';
import { ShareButton } from '../../ShareButton';
import { WorkCard } from '../WorkCard';
import { splitTagline } from './model';
import { focusRing, display, strongTextLink, wrap } from '@/components/themes/tokens';
export { focusRing, display, wrap };

// The pieces of the Sidebar theme that both the single page and the pages of a multi-page portfolio use.

// Side padding of every section: it follows the screen but never crowds a phone.
export const gutter = 'px-[clamp(1.25rem,5vw,4.5rem)]';
export const h2Class = `pt-h1 mb-10 scroll-mt-6 font-bold outline-none sm:mb-14 ${wrap}`;

export const primaryButton = `sb-link inline-flex min-h-12 items-center gap-3 bg-ink px-7 py-3 pt-small font-bold text-page hover:opacity-90 ${focusRing}`;
export const outlineButton = `inline-flex min-h-11 max-w-full items-center gap-2 border border-ink px-5 py-2.5 pt-small font-bold hover:bg-ink hover:text-page ${focusRing}`;
const bandButton = `inline-flex min-h-11 items-center border border-current px-5 pt-small font-bold hover:bg-white/15 ${focusRing}`;
const lightButton = `inline-flex min-h-11 items-center border border-ink px-5 pt-small font-bold hover:bg-ink hover:text-page ${focusRing}`;
export const textLink = strongTextLink;

export const Arrow = ({ className = 'size-5' }: { className?: string }) => (
  <ArrowRight aria-hidden="true" className={`${className} sb-arrow rtl:-scale-x-100`} />
);

// A section: its heading (an h2 the rail can move focus to) and its content, in the airy column.
export function Frame({
  block,
  children,
  band = false,
  kicker,
}: {
  block: Pick<Block, 'id' | 'title'>;
  children: ReactNode;
  band?: boolean;
  kicker?: string; // a small italic line above the heading
}) {
  return (
    <section
      aria-labelledby={block.id}
      className={`${band ? 'sb-band' : ''} ${gutter} py-16 sm:py-24`}
    >
      <div className="mx-auto max-w-5xl">
        {kicker && <p className="sb-it mb-3 pt-body italic">{kicker}</p>}
        <h2 id={block.id} tabIndex={-1} className={`${h2Class} ${band ? 'pt-title' : ''}`}>
          {block.title}
        </h2>
        {children}
      </div>
    </section>
  );
}

// ---- Hero

// A circular photo (or a big monogram) with simple shapes in the accent behind it. All the shapes are
// decoration; the photo has the owner's alt text.
function Portrait({ avatar }: { avatar: HeaderModel['avatar'] }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[24rem] min-[900px]:max-w-[28rem]">
      <span aria-hidden="true" className="absolute inset-[4%] rounded-full bg-accent-soft" />
      <span
        aria-hidden="true"
        className="absolute start-[2%] top-[6%] h-[46%] w-[22%] rotate-[28deg] rounded-full bg-accent"
      />
      <span
        aria-hidden="true"
        className="absolute end-[0%] bottom-[6%] size-[30%] rotate-12 border-2 border-accent"
      />
      <Avatar
        avatar={avatar}
        className="absolute inset-[11%] size-[78%] rounded-full"
        placeholderClassName="bg-ink pt-display font-bold text-page"
      />
    </div>
  );
}

// The name in mixed weights: the given names light, the family name bold. One word is all bold.
function MixedName({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return <span className="font-bold">{name}</span>;
  const last = words.pop();
  return (
    <>
      <span className="font-light">{words.join(' ')} </span>
      <span className="font-bold">{last}</span>
    </>
  );
}

export function Hero({
  header,
  id,
  primary,
}: {
  header: HeaderModel;
  id: string;
  primary: { href: string; label: string } | null;
}) {
  const ui = header.ui;
  const [role, rest] = header.tagline ? splitTagline(header.tagline) : ['', ''];
  const details = header.links.filter((link) => link.type === 'email' || link.type === 'phone');
  const chip = `inline-flex min-h-6 max-w-full items-center gap-2 pt-small font-bold underline-offset-4 hover:underline ${focusRing}`;
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-label={header.name}
      className={`${gutter} scroll-mt-6 py-12 outline-none sm:py-20 min-[900px]:py-24`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 min-[1100px]:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0">
          <h1 className={`sb-tight pt-display ${wrap}`}>
            <MixedName name={header.name} />
          </h1>
          {header.tagline && (
            <p className={`mt-6 max-w-xl pt-body text-pretty ${wrap}`}>
              {rest ? (
                <>
                  <em className="sb-it font-bold">{role}</em>
                  {rest}
                </>
              ) : (
                header.tagline
              )}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
            {primary && (
              <Link href={primary.href} className={primaryButton}>
                {primary.label}
                <Arrow />
              </Link>
            )}
            {header.resume && <ResumeLink resume={header.resume} className={outlineButton} />}
            {header.contact && <ContactLink contact={header.contact} className={outlineButton} />}
            <ShareButton {...header.share} ui={ui.share} variant="outline" />
          </div>
          {details.length > 0 && (
            <ul aria-label={ui.pages.reach} className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {details.map((link) => (
                <li key={link.id} className="min-w-0">
                  <HeaderLink link={link} className={`${chip} ${wrap}`} />
                </li>
              ))}
            </ul>
          )}
          <AvailabilityBadge
            availability={header.availability}
            ui={ui}
            className="mt-8 max-w-xl border border-line px-4 py-3 pt-small text-ink"
            dotClassName="bg-accent"
            linkClassName={textLink}
          />
        </div>
        <Portrait avatar={header.avatar} />
      </div>
    </section>
  );
}

// ---- Facts, numbers and the quote

// Facts about the work, worked out from the real dates and lists: plain text, nothing counts up.
export function Stats({ stats }: { stats: { value: number; label: string }[] }) {
  if (stats.length === 0) return null;
  return (
    <ul className="pt-h3 flex flex-wrap gap-x-8 gap-y-2 font-bold">
      {stats.map((stat) => (
        <li key={stat.label}>
          <span className="pt-date">{stat.value}</span>{' '}
          <span className="font-normal">{stat.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function Facts({
  facts,
  label,
}: {
  facts: { label: string; value: string; href?: string }[];
  label: string;
}) {
  if (facts.length === 0) return null;
  return (
    <dl aria-label={label} className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0 border-t border-line pt-3">
          <dt className="pt-small text-muted">{fact.label}</dt>
          <dd className={`mt-0.5 font-bold ${wrap}`}>
            {fact.href ? (
              <a
                href={fact.href}
                className={`underline underline-offset-4 hover:no-underline ${focusRing}`}
              >
                {fact.value}
              </a>
            ) : (
              fact.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// The dark panel with one quote. Near-black with a little of the accent, like the rail.
export function DarkQuote({
  quote,
  label,
}: {
  quote: { message: string; name: string; detail: string | null };
  label: string;
}) {
  return (
    <figure
      aria-label={label}
      className="sb-quote-dark bg-(--rail) p-8 text-[#f4f3f0] sm:p-12 print:break-inside-avoid"
    >
      <blockquote className={`sb-tight pt-h3 font-bold text-pretty whitespace-pre-line ${wrap}`}>
        {quote.message}
      </blockquote>
      <figcaption className="mt-5 pt-small">
        <span className="font-bold">{quote.name}</span>
        {quote.detail && <span className="text-[#c9c6bf]"> · {quote.detail}</span>}
      </figcaption>
    </figure>
  );
}

export function WorkingTogether({ work }: { work: NonNullable<HeaderModel['work']> }) {
  return (
    <WorkCard
      work={work}
      className="border border-line bg-surface p-5 text-start text-ink"
      linkClassName={textLink}
      buttonClassName={`bg-ink px-3 py-1.5 pt-fine font-bold text-page hover:opacity-90 ${focusRing}`}
    />
  );
}

// ---- Experience: the accent band

function EntryRow({ entry, locale }: { entry: Entry; locale: string }) {
  return (
    <li className="grid gap-1 border-t border-line py-7 sm:grid-cols-[1fr_auto] sm:gap-x-10 sm:py-9">
      <div className="min-w-0">
        <h3 className={`pt-h2 pt-name font-bold ${wrap}`}>{entry.title}</h3>
        {entry.subtitle && <p className={`mt-1 pt-body ${wrap}`}>{entry.subtitle}</p>}
        {entry.roles && (
          <RoleList
            roles={entry.roles}
            className="mt-4 space-y-4"
            titleClassName="pt-h3 font-bold"
            datesClassName="pt-small tabular-nums"
            descriptionClassName="mt-1 "
          />
        )}
        {entry.description && (
          <ReadMore
            text={entry.description}
            locale={locale}
            lines={6}
            from={1500}
            className="mt-3 "
          />
        )}
      </div>
      {entry.start && (
        <p className="pt-body font-bold tabular-nums sm:text-end">
          <DateRange
            start={entry.start}
            end={entry.end}
            openEnded
            duration={entry.duration}
            fmt={entry.fmt}
          />
        </p>
      )}
    </li>
  );
}

export function Roles({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  const list = (items: Entry[]) => (
    <ol>
      {items.map((entry) => (
        <EntryRow key={entry.id} entry={entry} locale={block.locale} />
      ))}
    </ol>
  );
  return (
    <>
      {list(block.entries)}
      {block.rest.length > 0 && (
        <Collapse
          className="mt-6"
          label={fill(block.ui.density.earlierRoles, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
          buttonClassName={bandButton}
        >
          {list(block.rest)}
        </Collapse>
      )}
    </>
  );
}

// Education: the same calm list on the light page.
export function Studies({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  return (
    <ol>
      {block.entries.map((entry) => (
        <li
          key={entry.id}
          className="grid gap-1 border-t border-line py-6 sm:grid-cols-[1fr_auto] sm:gap-x-10"
        >
          <div className="min-w-0">
            <h3 className={`pt-h3 font-bold ${wrap}`}>{entry.title}</h3>
            {entry.subtitle && <p className={`mt-1 text-muted ${wrap}`}>{entry.subtitle}</p>}
          </div>
          {entry.start && (
            <p className="pt-small font-bold text-muted tabular-nums sm:text-end">
              <DateRange start={entry.start} end={entry.end} fmt={entry.fmt} />
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

// ---- A custom section the owner made (a list of items): an accordion of native <details>, so it opens with the keyboard,
// works without JavaScript and is open in print.

export function Accordion({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  return (
    <ul className="border-b border-line">
      {block.entries.map((entry) => {
        const hasBody = entry.subtitle || entry.description || entry.href || entry.start;
        const title = <span className={`min-w-0 pt-h3 font-bold ${wrap}`}>{entry.title}</span>;
        return (
          <li key={entry.id} className="border-t border-line">
            {hasBody ? (
              <details className="sb-acc group">
                <summary
                  className={`flex min-h-16 cursor-pointer items-center justify-between gap-6 py-6 ${focusRing} focus-visible:-outline-offset-2`}
                >
                  {title}
                  <span aria-hidden="true" className="shrink-0">
                    <Plus className="size-6 group-open:hidden" />
                    <Minus className="hidden size-6 group-open:block" />
                  </span>
                </summary>
                <div className="max-w-3xl pb-8">
                  {entry.subtitle && (
                    <p className={`pt-body font-bold ${wrap}`}>{entry.subtitle}</p>
                  )}
                  {entry.start && (
                    <p className="mt-1 pt-small text-muted tabular-nums">
                      <DateRange start={entry.start} end={entry.end} fmt={entry.fmt} />
                    </p>
                  )}
                  {entry.description && (
                    <p className={`mt-3 whitespace-pre-line text-muted ${wrap}`}>
                      {entry.description}
                    </p>
                  )}
                  {entry.href && (
                    <p className="mt-4">
                      <NewTabLink
                        href={entry.href}
                        context={entry.title}
                        className={`inline-flex items-center gap-1 ${textLink}`}
                      >
                        {block.ui.pages.visit}
                        <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
                      </NewTabLink>
                    </p>
                  )}
                </div>
              </details>
            ) : (
              <div className="flex min-h-16 items-center py-6">{title}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---- Work: two columns of [text | cover], the cover alternating from row to row

function ProjectRow({ project, index }: { project: ProjectEntry; index: number }) {
  // One column below 1280px: every second project is flipped. Two columns from 1280px: every second ROW.
  const flip = `${index % 2 === 1 ? 'max-[1279px]:sm:flex-row-reverse' : ''} ${Math.floor(index / 2) % 2 === 1 ? 'min-[1280px]:flex-row-reverse' : ''}`;
  const kicker = project.tags[0];
  return (
    <li
      className={`sb-link relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-8 ${flip}`}
    >
      <div className="min-w-0 sm:w-[42%]">
        {kicker && (
          <p className={`sb-it mb-2 pt-small font-bold text-muted italic ${wrap}`}>{kicker}</p>
        )}
        <h3 className={`pt-h1 font-bold text-balance ${wrap}`}>
          <Link
            href={project.detailHref}
            className={`after:absolute after:inset-0 hover:underline hover:underline-offset-4 ${focusRing}`}
          >
            {project.name}
          </Link>
        </h3>
        <span aria-hidden="true" className="mt-4 inline-flex">
          <ArrowUpRight className="sb-arrow size-8 rtl:-scale-x-100" />
        </span>
      </div>
      <div className="min-w-0 sm:w-[58%]">
        {project.cover ? (
          <ProjectCover project={project} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="flex aspect-[4/3] w-full flex-col justify-end gap-2 bg-accent-soft p-5"
          >
            <span className={`line-clamp-3 pt-h2 font-bold ${wrap}`}>{project.name}</span>
            {project.tags.length > 0 && (
              <span className={`line-clamp-2 pt-small ${wrap}`}>
                {project.tags.slice(0, 3).join(' · ')}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function WorkList({ projects, id }: { projects: ProjectEntry[]; id?: string }) {
  return (
    <ul id={id} className="grid gap-x-12 gap-y-14 min-[1280px]:grid-cols-2">
      {projects.map((project, index) => (
        <ProjectRow key={project.id} project={project} index={index} />
      ))}
    </ul>
  );
}

export function Projects({ block }: { block: Extract<Block, { kind: 'projects' }> }) {
  return (
    <>
      <WorkList projects={block.projects} />
      {block.rest.length > 0 && (
        <Collapse
          className="mt-10"
          label={fill(block.ui.density.moreProjects, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
          buttonClassName={lightButton}
        >
          <div className="mt-12">
            <WorkList projects={block.rest} />
          </div>
        </Collapse>
      )}
    </>
  );
}

// ---- Writing: a row of three cards

function PostCard({ post, locale, badge }: { post: WritingEntry; locale: string; badge: string }) {
  const link = post.external ? (
    <NewTabLink href={post.href} className={`after:absolute after:inset-0 ${focusRing}`}>
      {post.title}
    </NewTabLink>
  ) : (
    <Link href={post.href} className={`after:absolute after:inset-0 ${focusRing}`}>
      {post.title}
    </Link>
  );
  return (
    <li className="group relative min-w-0">
      {post.cover ? (
        <img
          src={post.cover}
          alt=""
          loading="lazy"
          decoding="async"
          width={1200}
          height={630}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-[4/3] w-full items-end bg-accent-soft p-5 pt-display leading-none font-bold"
        >
          {Array.from(post.title)[0]}
        </div>
      )}
      <p className="sb-it mt-4 pt-small text-muted italic">
        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
        {post.external && <span className="ms-2 font-bold not-italic">{badge}</span>}
      </p>
      <h3
        className={`mt-1 pt-body font-bold group-hover:underline group-hover:underline-offset-4 ${wrap}`}
      >
        {link}
      </h3>
    </li>
  );
}

export function Writing({ block }: { block: Extract<Block, { kind: 'writing' }> }) {
  return (
    <>
      <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 min-[1000px]:grid-cols-3">
        {block.posts.map((post) => (
          <PostCard key={post.id} post={post} locale={block.locale} badge={block.ui.linkBadge} />
        ))}
      </ul>
      {block.more && (
        <p className="mt-12">
          <Link href={block.allHref} className={`${lightButton} sb-link gap-2`}>
            {block.ui.viewAll}
            <Arrow className="size-4" />
          </Link>
        </p>
      )}
    </>
  );
}

// ---- Contact: the details set big on one side, the form on the accent panel on the other

export function ContactSplit({
  header,
  heading,
  id,
  as: Heading = 'h2',
  form,
  extras,
}: {
  header: HeaderModel;
  heading: string;
  id: string;
  as?: 'h1' | 'h2';
  form: ReactNode | null;
  extras?: ReactNode;
}) {
  const ui = header.ui;
  const details = header.links.filter((link) => link.type === 'email' || link.type === 'phone');
  const elsewhere = header.links.filter((link) => link.type !== 'email' && link.type !== 'phone');
  return (
    <section aria-labelledby={id} className={`${gutter} py-16 sm:py-24`}>
      <div
        className={`mx-auto grid max-w-6xl gap-12 ${form ? 'min-[1000px]:grid-cols-[1fr_1.1fr] min-[1000px]:gap-16' : ''}`}
      >
        <div className="min-w-0">
          <Heading id={id} tabIndex={-1} className={`${h2Class} !mb-8`}>
            {heading}
          </Heading>
          {details.length > 0 && (
            <ul className="space-y-3">
              {details.map((link) => {
                const Icon = LINK_ICONS[link.type];
                return (
                  <li key={link.id} className="min-w-0">
                    <a
                      href={link.href}
                      className={`inline-flex max-w-full items-center gap-3 pt-h2 font-bold underline-offset-4 hover:underline ${wrap} ${focusRing}`}
                    >
                      <span aria-hidden="true" className="inline-flex shrink-0">
                        <Icon className="size-[0.8em]" />
                      </span>
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          {elsewhere.length > 0 && (
            <ul aria-label={ui.pages.links} className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {elsewhere.map((link) => (
                <li key={link.id} className="min-w-0">
                  <HeaderLink
                    link={link}
                    className={`inline-flex min-h-8 items-center gap-2 pt-small font-bold underline underline-offset-4 hover:no-underline ${wrap} ${focusRing}`}
                  />
                </li>
              ))}
            </ul>
          )}
          {extras}
        </div>
        {form && <div className="sb-band min-w-0 self-start p-6 sm:p-10 print:hidden">{form}</div>}
      </div>
    </section>
  );
}

// The contact form as it sits on the accent panel: a near-black button, white text.
export function FormInBand({
  form,
  state,
}: {
  form: Parameters<typeof ContactForm>[0]['form'];
  state?: Parameters<typeof ContactForm>[0]['page'];
}) {
  return (
    <ContactForm
      form={form}
      page={state}
      buttonClassName={`inline-flex min-h-12 items-center bg-[#111] px-7 py-3 pt-small font-bold text-white hover:bg-black ${focusRing}`}
    />
  );
}
