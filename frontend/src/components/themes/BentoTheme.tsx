import type { CSSProperties, ReactNode } from 'react';
import { pageLabel } from '@/lib/pages';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { accentVars } from '@/lib/color';
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
import { EntryList, Expander, SkillList } from './kit';
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
  ProjectCover,
  ProjectVisit,
  CtaView,
  IdentityStrip,
  isHeroProject,
} from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import { BentoPages } from './templates/BentoPages';
import { pageView } from './templates/model';
import type { ThemeProps } from './types';
import { focusRing, display } from '@/components/themes/tokens';

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

// What the accent looks like as text on a dark tile, for `tiles="dark"`.
const DARK_TILE = { scheme: 'dark', background: '#12141c', text: '#eef0f6' } as const;

type Tone = 'plain' | 'strong' | 'solid' | 'mesh';
interface Tile {
  key: string;
  span: number; // out of 6 columns, from the amount of content
  tone: Tone;
  node: ReactNode;
}

// ---- sizes. A tile is as wide as its text needs; the packing below fixes the rows.
function spanFor(weight: number, min: number, max: number): number {
  const span = weight < 450 ? 3 : 6;
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
    <h2 id={id} className="pt-small mb-4 font-semibold text-muted">
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

const chip = 'rounded-full border border-line bg-page/70 px-3 py-1 font-medium';

// Experience is the largest group: one full-width list tile, the latest roles in full and the rest behind
// "Earlier experience". Education and custom lists use the same list at the width their text needs.
function EntriesTile({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  const lead = block.variant === 'experience';
  return (
    <section aria-labelledby={block.id} className="min-w-0">
      <h2 id={block.id} className={`${display} mb-5 font-bold ${lead ? 'pt-h1' : 'pt-h2'}`}>
        {block.title}
      </h2>
      <EntryList
        block={block}
        totalClassName="text-muted"
        classes={{
          list: 'divide-y divide-line',
          item: 'py-6 first:pt-0',
          title: `${display} font-bold ${lead ? 'pt-h2' : 'pt-h3'}`,
          org: 'text-muted',
          dates: 'text-muted',
        }}
      />
    </section>
  );
}

// ---- the tiles
function identityTile(header: HeaderModel): Tile {
  return {
    key: 'identity',
    span: 4,
    tone: 'mesh', // the one tile with a mesh of the accent and its neighbors
    node: (
      <div className="flex h-full min-w-0 flex-col justify-between gap-8">
        <Avatar
          avatar={header.avatar}
          className="size-24 rounded-[1.75rem] sm:size-28"
          placeholderClassName={`${display} bg-accent pt-title font-bold text-on-accent`}
        />
        <div className="min-w-0">
          {header.location && (
            <p className="pt-small mb-3 flex items-center gap-1.5 font-medium text-muted">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span>{header.location}</span>
            </p>
          )}
          <h1 className={`${display} pt-title pt-name font-bold`}>{header.name}</h1>
          {header.tagline && (
            <p className="pt-h3 pt-measure mt-3 font-normal text-muted">{header.tagline}</p>
          )}
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="pt-small mt-5 w-fit rounded-2xl bg-surface px-3.5 py-2.5 text-ink"
            dotClassName="bg-accent-fg"
            linkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          />
          {header.work && (
            <WorkCard
              work={header.work}
              className="pt-small mt-4 w-full max-w-sm rounded-2xl bg-surface px-4 py-3.5 text-ink"
              linkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`pt-fine rounded-full border border-line px-3 py-1 font-semibold hover:bg-page ${focusRing}`}
            />
          )}
        </div>
      </div>
    ),
  };
}

function linksTile(header: HeaderModel, idPrefix: string): Tile {
  const link = `pt-small flex max-w-full items-center gap-3 rounded-xl px-3 py-2 font-semibold transition-colors hover:bg-surface ${focusRing}`;
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
              <ReadMore
                text={block.text}
                locale={block.locale}
                from={900}
                lines={9}
                className="pt-body"
              />
              {block.moreLink && <MoreLinkView more={block.moreLink} />}
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
            3,
            3,
          ),
          tone: 'plain',
          node: (
            <TileBody id={block.id} title={block.title}>
              <SkillList block={block} className="flex flex-wrap gap-2" itemClassName={chip} />
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
          span: block.variant === 'experience' ? 6 : spanFor(weight, 3, 6),
          tone: 'plain',
          node: <EntriesTile block={block} />,
        },
      ];
    }
    case 'projects': {
      const tiles: Tile[] = block.projects.map((project, position) => ({
        key: `${block.id}-${project.id}`,
        span: isHeroProject(block, project) ? 6 : 3,
        tone: 'plain',
        node: (
          <section
            aria-labelledby={`${block.id}-${project.id}`}
            className="flex h-full min-w-0 flex-col"
          >
            <ProjectCover
              project={project}
              className="mb-4 aspect-[40/21] w-full rounded-2xl object-cover"
            />
            {/* The section's heading is said once, on the first tile; the others carry it for screen
                readers only, so every tile does not repeat a label. */}
            <p className={position === 0 ? 'pt-small mb-4 font-semibold text-muted' : 'sr-only'}>
              {block.title}
            </p>
            <h2
              id={`${block.id}-${project.id}`}
              className={`${display} pt-h3 flex items-start justify-between gap-3 font-bold`}
            >
              <Link
                href={project.detailHref}
                className={`min-w-0 after:absolute after:inset-0 after:rounded-3xl ${focusRing}`}
              >
                {project.name}
              </Link>
              <ArrowUpRight
                aria-hidden="true"
                className="rtl:-scale-x-100 mt-1 size-5 shrink-0 text-muted"
              />
            </h2>
            {project.description && (
              <ReadMore
                text={project.description}
                locale={block.locale}
                className="pt-body mt-3 flex-1 text-muted"
              />
            )}
            {project.tags.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <li key={tag} className={`${chip} pt-fine px-2.5 py-0.5`}>
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            <ProjectVisit
              project={project}
              label={block.ui.viewProject}
              className={`pt-small font-semibold underline underline-offset-4 hover:no-underline ${focusRing}`}
            />
          </section>
        ),
      }));
      if (block.moreLink) {
        tiles.push({
          key: `${block.id}-all`,
          span: 6,
          tone: 'plain',
          node: <MoreLinkView more={block.moreLink} className="text-center" />,
        });
      }
      if (block.rest.length > 0) {
        tiles.push({
          key: `${block.id}-rest`,
          span: 6,
          tone: 'plain',
          node: (
            <Expander
              label={fill(block.ui.density.moreProjects, { count: block.rest.length })}
              closeLabel={block.ui.density.showLess}
            >
              <ul className="mt-5 grid gap-x-8 gap-y-6 md:grid-cols-2">
                {block.rest.map((project) => (
                  <li key={project.id} className="min-w-0">
                    <h3 className={`${display} pt-h3 font-bold`}>
                      <Link href={project.detailHref} className={`underline ${focusRing}`}>
                        {project.name}
                      </Link>
                    </h3>
                    {project.description && (
                      <ReadMore
                        text={project.description}
                        locale={block.locale}
                        className="mt-1 text-muted"
                      />
                    )}
                    {project.tags.length > 0 && (
                      <p className="pt-small mt-2 text-muted">{project.tags.join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Expander>
          ),
        });
      }
      return tiles;
    }
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
                titleClassName={`${display} pt-h3 font-bold`}
                linkClassName={`after:absolute after:inset-0 after:rounded-2xl ${focusRing}`}
                metaClassName="pt-small mt-1 font-medium text-muted"
                excerptClassName="pt-body mt-2 text-muted"
                moreClassName={`pt-small mt-6 inline-block font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              />
            </TileBody>
          ),
        },
      ];
    case 'cta':
      return [
        {
          key: block.id,
          span: 6,
          tone: 'plain',
          node: (
            <TileBody id={block.id} title={block.title}>
              <CtaView
                block={block}
                className="print:hidden"
                linkClassName={`pt-small inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 font-semibold text-page transition-opacity hover:opacity-90 ${focusRing}`}
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
                  buttonClassName={`pt-small inline-flex items-center rounded-full border border-line bg-page/70 px-5 py-2 font-semibold transition-colors hover:bg-page ${focusRing}`}
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
              className={`${display} block h-9 pt-display leading-[0.9] font-bold text-accent-fg`}
            >
              “
            </span>
            <blockquote className="pt-body mt-2 flex-1 whitespace-pre-line">
              {item.message}
            </blockquote>
            <figcaption className="pt-small mt-5 flex items-center gap-3">
              <InitialsBadge name={item.name} className="pt-fine size-9 bg-accent-soft text-ink" />
              <span className="min-w-0">
                <span className="block font-semibold">{item.name}</span>
                {item.detail && <span className="block text-muted">{item.detail}</span>}
              </span>
            </figcaption>
          </figure>
        ),
      }));
      if (block.rest.length > 0) {
        tiles.push({
          key: `${block.id}-rest`,
          span: 6,
          tone: 'plain',
          node: (
            <Expander
              label={fill(block.ui.density.moreTestimonials, { count: block.rest.length })}
              closeLabel={block.ui.density.showLess}
            >
              <ul className="mt-5 grid gap-6 md:grid-cols-2">
                {block.rest.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <blockquote className="pt-body whitespace-pre-line">{item.message}</blockquote>
                    <p className="pt-small mt-2">
                      <span className="font-semibold">{item.name}</span>
                      {item.detail && <span className="text-muted">, {item.detail}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </Expander>
          ),
        });
      }
      if (block.submitTo || tiles.length === 0) {
        tiles.push({
          key: `${block.id}-leave`,
          span: 2,
          tone: 'strong',
          node: (
            <TileBody id={block.id} title={block.title}>
              {block.submitTo && (
                <LeaveTestimonial
                  slug={block.submitTo}
                  ui={block.ui.leave}
                  buttonClassName={`pt-small inline-flex items-center rounded-full border border-line bg-page/70 px-5 py-2 font-semibold transition-colors hover:bg-page ${focusRing}`}
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
    <footer className="pt-small mx-auto max-w-6xl px-4 pb-10 text-center text-muted sm:px-6">
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
  page,
  nav,
  heading,
  lead: leadNode,
  project,
  contact,
  tiles = 'light',
}: ThemeProps & { tiles?: 'light' | 'dark' }) {
  const vars = { '--accent-fg-dark': accentVars(profile.accentColor, DARK_TILE)['--accent-fg'] };
  // The pages of a multi-page portfolio (and a project's own page) are tile compositions of their own.
  const view = pageView(profile, { page, project, contact });
  if (view) {
    return (
      <BentoPages
        profile={profile}
        view={view}
        nav={nav}
        idPrefix={idPrefix}
        tiles={tiles}
        fontClass={fontClass}
        vars={vars}
        footer={<Footer footer={buildFooter(profile)} />}
        blockTiles={blockTiles}
      />
    );
  }
  const header = buildHeader(profile);
  // An inner page has no identity and links tiles: just its sections.
  const inner = !!heading || !!leadNode;
  const lead = inner ? 0 : 2;
  const blocks = buildBlocks(profile, idPrefix, page);
  const identity =
    heading && !lead && page && (page.key === 'work' || page.key === 'about') ? (
      <IdentityStrip
        header={buildHeader(profile)}
        full={page.key === 'about'}
        wrapClassName="mb-5 flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 sm:gap-6 sm:p-6"
        avatarClassName="size-20 shrink-0 rounded-2xl sm:size-28"
        placeholderClassName={`${display} bg-page pt-title font-bold text-ink`}
        nameClassName={`${display} pt-h2 font-bold`}
        taglineClassName="mt-1 text-muted"
        metaClassName="pt-small mt-1 text-muted"
        pillClassName={`pt-small inline-flex items-center gap-2 rounded-full border border-line bg-page px-4 py-2 font-semibold hover:bg-surface ${focusRing}`}
        badgeClassName="pt-small mt-3 text-ink"
        badgeDotClassName="bg-accent-fg"
        badgeLinkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
      />
    ) : null;
  const all: Tile[] = [
    ...(inner ? [] : [identityTile(header), linksTile(header, idPrefix)]),
    ...blocks.flatMap(blockTiles),
  ];
  // Every third tile after the first two is a little stronger, so the grid has a rhythm.
  all.forEach((tile, i) => {
    if (i >= lead && tile.tone === 'plain' && i % 3 === 1) tile.tone = 'strong';
  });
  const lg = pack(
    all.map((tile) => tile.span),
    6,
  );
  const sm = pack(
    all.map((tile) => (tile.span >= 4 ? 2 : 1)),
    2,
  );
  const empty = all.length === lead && blocks.length === 0 && !leadNode;

  return (
    <ThemeWrapper theme="bento" profile={profile} nav={nav} className={fontClass} vars={vars}>
      <div data-tiles={tiles}>
        <main id={`${idPrefix}main`} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          {leadNode ??
            (heading && (
              <PageHeading
                heading={heading}
                title={page ? pageLabel(profile, page) : undefined}
                kicker={profile.fullName}
                wrapClassName="mb-5 px-1 sm:mb-7"
                kickerClassName={`pt-small mb-1 font-semibold text-muted`}
                className={`${display} pt-display pt-name font-bold`}
              />
            ))}
          {identity}
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {all.map((tile, i) => (
              <li
                key={tile.key}
                data-tone={tile.tone}
                style={{ '--i': i } as CSSProperties}
                className={`bento-tile fx-item relative min-w-0 rounded-3xl border p-6 transition duration-200 hover:shadow-raised sm:p-7 ${SM[sm[i]]} ${LG[lg[i]]}`}
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
