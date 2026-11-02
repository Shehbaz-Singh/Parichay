import type { CSSProperties, ReactNode } from 'react';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { accentVars } from '@/lib/color';
import { ShareButton } from '../ShareButton';
import {
  buildBlocks,
  buildFooter,
  buildHeader,
  type Block,
  type Entry,
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
  FooterLines,
} from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// A bento grid: the page is rounded tiles of different sizes. The person and the links come first,
// then one tile per section (one per project, one per testimonial) in the owner's order. Tile
// sizes follow the amount of text in them, and each row is filled by widening its last tile, so the
// grid has no holes and the reading order is the visual order. One column on a phone, two on a
// tablet, six units wide on a desktop. Tiles are tinted from the accent color (globals.css:
// .bento-tile); `tiles="dark"` makes them dark on the same light page. Sora for headings, Plus
// Jakarta Sans for text.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${sora.variable}`;

const display = 'font-(family-name:--font-theme-display)';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

// What the accent looks like as text on a dark tile, for `tiles="dark"`.
const DARK_TILE = { scheme: 'dark', background: '#12141c', text: '#eef0f6' } as const;

type Tone = 'plain' | 'strong' | 'solid';
interface Tile {
  key: string;
  span: number; // out of 6 columns, from the amount of content
  tone: Tone;
  node: ReactNode;
}

// ---- sizes. A tile is as wide as its text needs; the packing below fixes the rows.
function spanFor(weight: number, min: number, max: number): number {
  const span = weight < 200 ? 2 : weight < 450 ? 3 : weight < 900 ? 4 : 6;
  return Math.min(max, Math.max(min, span));
}

// Puts the spans in rows of `cols`. A tile that does not fit in what is left of a row is not moved
// (that would change the reading order): the row's last tile is widened to close it instead.
function pack(spans: number[], cols: number): number[] {
  const out = [...spans.map((span) => Math.min(span, cols))];
  let left = cols;
  let last = -1;
  out.forEach((span, i) => {
    if (span > left) {
      out[last] += left;
      left = cols;
    }
    left -= span;
    last = i;
    if (left === 0) left = cols;
  });
  if (last >= 0 && left < cols) out[last] += left;
  return out;
}

const LG = [
  '',
  'lg:col-span-1',
  'lg:col-span-2',
  'lg:col-span-3',
  'lg:col-span-4',
  'lg:col-span-5',
  'lg:col-span-6',
];
const SM = ['', 'sm:col-span-1', 'sm:col-span-2'];

function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-4 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
      {children}
    </h2>
  );
}

function TileBody({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex h-full min-w-0 flex-col">
      <Heading id={id}>{title}</Heading>
      {children}
    </section>
  );
}

const chip = 'rounded-full border border-line bg-page/70 px-3 py-1 text-sm font-medium';

function EntriesTile({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  const [latest, ...earlier] = block.entries;
  const open = block.variant !== 'custom';
  const dates = (entry: Entry) =>
    entry.start && (
      <DateRange
        start={entry.start}
        end={entry.end}
        openEnded={open}
        duration={entry.duration}
        fmt={entry.fmt}
      />
    );
  return (
    <TileBody id={block.id} title={block.title}>
      <TotalExperience
        total={block.total}
        label={block.ui.totalExperience}
        className="mb-3 text-sm text-muted"
      />
      <div className="min-w-0">
        {latest.start && (
          <p className="mb-2 inline-block rounded-full bg-accent-soft px-3 py-0.5 text-xs font-semibold text-ink tabular-nums">
            {dates(latest)}
          </p>
        )}
        <h3 className={`${display} text-xl leading-snug font-bold`}>{latest.title}</h3>
        {latest.subtitle && <p className="text-muted">{latest.subtitle}</p>}
        {latest.roles && (
          <RoleList
            roles={latest.roles}
            className="mt-3 space-y-3 border-s border-line ps-4"
            titleClassName="font-semibold"
            datesClassName="text-sm text-muted tabular-nums"
            descriptionClassName="mt-1 text-sm leading-relaxed"
          />
        )}
        {latest.description && (
          <p className="mt-3 leading-relaxed whitespace-pre-line">{latest.description}</p>
        )}
        {latest.href && (
          <p className="mt-3 text-sm">
            <NewTabLink
              href={latest.href}
              context={latest.title}
              className={`inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:no-underline ${focusRing}`}
            >
              View
              <ArrowUpRight aria-hidden="true" className="rtl:-scale-x-100 size-4" />
            </NewTabLink>
          </p>
        )}
      </div>
      {earlier.length > 0 && (
        <ol className="mt-5 divide-y divide-line border-t border-line">
          {earlier.map((entry) => (
            <li key={entry.id} className="min-w-0 py-3 text-sm">
              <p className="font-semibold">
                {entry.title}
                {entry.subtitle && (
                  <span className="font-normal text-muted"> · {entry.subtitle}</span>
                )}
              </p>
              {entry.start && <p className="text-muted tabular-nums">{dates(entry)}</p>}
              {entry.roles && (
                <RoleList
                  roles={entry.roles}
                  className="mt-2 space-y-2 border-s border-line ps-3"
                  titleClassName="font-medium"
                  datesClassName="text-muted tabular-nums"
                />
              )}
              {entry.description && (
                <p className="mt-1 whitespace-pre-line text-muted">{entry.description}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </TileBody>
  );
}

// ---- the tiles
function identityTile(header: HeaderModel): Tile {
  return {
    key: 'identity',
    span: 4,
    tone: 'strong',
    node: (
      <div className="flex h-full min-w-0 flex-col justify-between gap-8">
        <Avatar
          avatar={header.avatar}
          className="size-24 rounded-[1.75rem] sm:size-28"
          placeholderClassName={`${display} bg-accent text-4xl font-bold text-on-accent`}
        />
        <div className="min-w-0">
          {header.location && (
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span>{header.location}</span>
            </p>
          )}
          <h1
            className={`${display} text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-tight text-balance`}
          >
            {header.name}
          </h1>
          {header.tagline && (
            <p className="mt-3 max-w-xl text-lg leading-snug text-pretty text-muted">
              {header.tagline}
            </p>
          )}
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="mt-5 w-fit rounded-2xl bg-surface px-3.5 py-2.5 text-sm text-ink"
            dotClassName="bg-accent-fg"
            linkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          />
          {header.work && (
            <WorkCard
              work={header.work}
              className="mt-4 w-full max-w-sm rounded-2xl bg-surface px-4 py-3.5 text-ink"
              linkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`rounded-full border border-line px-3 py-1 text-xs font-semibold hover:bg-page ${focusRing}`}
            />
          )}
        </div>
      </div>
    ),
  };
}

function linksTile(header: HeaderModel, idPrefix: string): Tile {
  const link = `flex max-w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface ${focusRing}`;
  return {
    key: 'links',
    span: 2,
    tone: 'solid',
    node: (
      <TileBody id={`${idPrefix}bento-links`} title={header.links.length > 0 ? 'Links' : 'Share'}>
        <ul className="-mx-3 space-y-0.5">
          {header.links.map((item) => (
            <li key={item.id} className="max-w-full">
              <HeaderLink link={item} className={link} />
            </li>
          ))}
          {header.contact && (
            <li className="print:hidden">
              <ContactLink contact={header.contact} className={link} />
            </li>
          )}
          {header.resume && (
            <li>
              <ResumeLink resume={header.resume} className={link} />
            </li>
          )}
        </ul>
        <div className="mt-auto pt-4">
          <ShareButton {...header.share} ui={header.ui.share} variant="inverse" />
        </div>
      </TileBody>
    ),
  };
}

const len = (...parts: (string | null | undefined)[]) =>
  parts.reduce((sum, part) => sum + (part?.length ?? 0), 0);

function blockTiles(block: Block): Tile[] {
  switch (block.kind) {
    case 'about':
      return [
        {
          key: block.id,
          span: spanFor(block.text.length, 3, 6),
          tone: 'plain',
          node: (
            <TileBody id={block.id} title={block.title}>
              <p className="text-lg leading-relaxed whitespace-pre-line">{block.text}</p>
            </TileBody>
          ),
        },
      ];
    case 'skills':
      return [
        {
          key: block.id,
          span: spanFor(
            block.skills.reduce((sum, skill) => sum + skill.name.length + 6, 0),
            2,
            4,
          ),
          tone: 'plain',
          node: (
            <TileBody id={block.id} title={block.title}>
              <ul className="flex flex-wrap gap-2">
                {block.skills.map((skill) => (
                  <li key={skill.id} className={chip}>
                    {skill.name}
                  </li>
                ))}
              </ul>
            </TileBody>
          ),
        },
      ];
    case 'entries': {
      const [latest, ...earlier] = block.entries;
      const weight = len(latest.title, latest.subtitle, latest.description) + earlier.length * 70;
      return [
        {
          key: block.id,
          span: spanFor(weight, 3, 6),
          tone: 'plain',
          node: <EntriesTile block={block} />,
        },
      ];
    }
    case 'projects':
      return block.projects.map((project) => ({
        key: `${block.id}-${project.id}`,
        span: spanFor(len(project.name, project.description) + project.tags.length * 8, 2, 3),
        tone: 'plain',
        node: (
          <section
            aria-labelledby={`${block.id}-${project.id}`}
            className="flex h-full min-w-0 flex-col"
          >
            <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {block.title}
            </p>
            <h2
              id={`${block.id}-${project.id}`}
              className={`${display} flex items-start justify-between gap-3 text-xl leading-snug font-bold`}
            >
              {project.href ? (
                <>
                  <NewTabLink
                    href={project.href}
                    className={`min-w-0 after:absolute after:inset-0 after:rounded-3xl ${focusRing}`}
                  >
                    {project.name}
                  </NewTabLink>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="rtl:-scale-x-100 mt-1 size-5 shrink-0 text-muted"
                  />
                </>
              ) : (
                project.name
              )}
            </h2>
            {project.description && (
              <p className="mt-3 flex-1 leading-relaxed whitespace-pre-line text-muted">
                {project.description}
              </p>
            )}
            {project.tags.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <li key={tag} className={`${chip} px-2.5 py-0.5 text-xs`}>
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ),
      }));
    case 'writing':
      return [
        {
          key: block.id,
          span: 6,
          tone: 'plain',
          node: (
            <TileBody id={block.id} title={block.title}>
              <WritingList
                block={block}
                className="grid gap-x-8 gap-y-6 md:grid-cols-3"
                itemClassName="group relative min-w-0"
                coverClassName="mb-3 aspect-[40/21] w-full rounded-2xl object-cover"
                titleClassName={`${display} text-lg leading-snug font-bold`}
                linkClassName={`after:absolute after:inset-0 after:rounded-2xl ${focusRing}`}
                metaClassName="mt-1 text-sm font-medium text-muted"
                excerptClassName="mt-2 leading-relaxed text-muted"
                moreClassName={`mt-6 inline-block text-sm font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              />
            </TileBody>
          ),
        },
      ];
    case 'contact':
      return [
        {
          key: block.id,
          span: 6,
          tone: 'plain',
          node: (
            <TileBody id={block.id} title={block.title}>
              <div className="max-w-xl print:hidden">
                <ContactForm
                  form={block.form}
                  buttonClassName={`inline-flex items-center rounded-full border border-line bg-page/70 px-5 py-2 text-sm font-semibold transition-colors hover:bg-page ${focusRing}`}
                />
              </div>
            </TileBody>
          ),
        },
      ];
    case 'testimonials': {
      const tiles: Tile[] = block.testimonials.map((item) => ({
        key: `${block.id}-${item.id}`,
        span: spanFor(item.message.length, 3, 3),
        tone: 'plain',
        node: (
          <figure className="flex h-full min-w-0 flex-col">
            <span
              aria-hidden="true"
              className={`${display} block h-9 text-6xl leading-[0.9] font-bold text-accent-fg`}
            >
              “
            </span>
            <blockquote className="mt-2 flex-1 text-lg leading-snug whitespace-pre-line">
              {item.message}
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 text-sm">
              <InitialsBadge name={item.name} className="size-9 bg-accent-soft text-xs text-ink" />
              <span className="min-w-0">
                <span className="block font-semibold">{item.name}</span>
                {item.detail && <span className="block text-muted">{item.detail}</span>}
              </span>
            </figcaption>
          </figure>
        ),
      }));
      if (block.submitTo || tiles.length === 0) {
        tiles.push({
          key: `${block.id}-leave`,
          span: 2,
          tone: 'strong',
          node: (
            <TileBody id={block.id} title={block.title}>
              {tiles.length === 0 && <p className="mb-4 text-muted">{block.ui.noTestimonials}</p>}
              {block.submitTo && (
                <LeaveTestimonial
                  slug={block.submitTo}
                  ui={block.ui.leave}
                  buttonClassName={`inline-flex items-center rounded-full border border-line bg-page/70 px-5 py-2 text-sm font-semibold transition-colors hover:bg-page ${focusRing}`}
                />
              )}
            </TileBody>
          ),
        });
      }
      return tiles;
    }
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm text-muted sm:px-6">
      <FooterLines
        footer={footer}
        linkClassName={`font-semibold text-ink underline underline-offset-4 hover:no-underline ${focusRing}`}
      />
    </footer>
  );
}

export default function BentoTheme({
  profile,
  idPrefix = '',
  tiles = 'light',
}: ThemeProps & { tiles?: 'light' | 'dark' }) {
  const header = buildHeader(profile);
  const all: Tile[] = [
    identityTile(header),
    linksTile(header, idPrefix),
    ...buildBlocks(profile, idPrefix).flatMap(blockTiles),
  ];
  // Every third tile after the first two is a little stronger, so the grid has a rhythm.
  all.forEach((tile, i) => {
    if (i >= 2 && tile.tone === 'plain' && i % 3 === 1) tile.tone = 'strong';
  });
  const lg = pack(
    all.map((tile) => tile.span),
    6,
  );
  const sm = pack(
    all.map((tile) => (tile.span >= 4 ? 2 : 1)),
    2,
  );
  const animate = !idPrefix;
  const empty = all.length === 2 && buildBlocks(profile, idPrefix).length === 0;

  return (
    <ThemeWrapper
      theme="bento"
      profile={profile}
      className={fontClass}
      vars={{ '--accent-fg-dark': accentVars(profile.accentColor, DARK_TILE)['--accent-fg'] }}
    >
      <div data-tiles={tiles}>
        <main id={`${idPrefix}main`} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {all.map((tile, i) => (
              <li
                key={tile.key}
                data-tone={tile.tone}
                style={{ '--i': i } as CSSProperties}
                className={`bento-tile relative min-w-0 rounded-3xl border p-6 transition duration-300 motion-safe:hover:-translate-y-1 hover:shadow-raised sm:p-7 ${SM[sm[i]]} ${LG[lg[i]]} ${animate ? 'bento-in' : ''}`}
              >
                {tile.node}
              </li>
            ))}
          </ul>
          {empty && (
            <EmptyPage
              text={uiFor(profile.locale).emptyPage}
              className="mt-6 text-center text-muted"
            />
          )}
        </main>
        <Footer footer={buildFooter(profile)} />
      </div>
    </ThemeWrapper>
  );
}
