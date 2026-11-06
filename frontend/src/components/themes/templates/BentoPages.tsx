import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '@/components/ShareButton';
import { formatMonthYear } from '@/lib/format';
import { fill, translatorFor, uiFor } from '@/lib/i18n';
import type { Block, HeaderModel, ProjectEntry } from '../blocks';
import { ContactForm } from '../ContactForm';
import {
  Avatar,
  AvailabilityBadge,
  ContactLink,
  HeaderLink,
  MoreLinkView,
  NewTabLink,
  ProjectVisit,
  ResumeLink,
} from '../parts';
import { ReadMore } from '../ReadMore';
import { ThemeWrapper } from '../ThemeWrapper';
import { WorkCard } from '../WorkCard';
import {
  Breadcrumbs,
  rootOf,
  type AboutPageModel,
  type ContactPageModel,
  type CustomPageModel,
  type HomeModel,
  type PageView,
  type ProjectPageModel,
  type WorkPageModel,
} from './model';
import { focusRing, tightDisplay as display, wrap } from '@/components/themes/tokens';

// The pages of a multi-page portfolio in the Bento theme. Every page is its own composition of rounded
// tiles, tinted from the accent, in the same grid as the single page (six units wide on a desktop, two
// on a tablet, one on a phone), and every page starts with who this is: Home with a big identity tile,
// the others with a small one beside the page's title. The theme passes in what it draws itself (its
// frame's fonts, the tiles of a block, the footer), so this file never imports the theme.

const chip = 'rounded-full border border-line bg-page/70 px-3 py-1 text-sm font-medium';
const stretched = `after:absolute after:inset-0 after:rounded-xl ${focusRing}`;

type Tone = 'plain' | 'strong' | 'solid' | 'mesh';
export interface BentoTile {
  key: string;
  span: number; // out of 6 columns
  tone: Tone;
  node: ReactNode;
  flush?: boolean;
}

export interface BentoPagesProps {
  profile: PublicProfile;
  view: PageView;
  nav?: ReactNode;
  idPrefix: string;
  tiles: 'light' | 'dark';
  fontClass: string;
  vars: Record<string, string>;
  footer: ReactNode;
  // The theme's own tiles for a section (jobs, education, skills, testimonials, a custom section...).
  blockTiles: (block: Block) => BentoTile[];
}

// ---- the grid. A tile that does not fit in what is left of a row is not moved (the reading order stays
// the visual order): the row's last tile is widened to close it, so there are no holes.
function pack(spans: number[], cols: number): number[] {
  const out = spans.map((span) => Math.min(span, cols));
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

function Grid({ tiles }: { tiles: BentoTile[] }) {
  const lg = pack(
    tiles.map((tile) => tile.span),
    6,
  );
  const sm = pack(
    tiles.map((tile) => (tile.span >= 4 ? 2 : 1)),
    2,
  );
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {tiles.map((tile, i) => (
        <li
          key={tile.key}
          data-tone={tile.tone}
          style={{ '--i': i } as CSSProperties}
          className={`bento-tile fx-item relative min-w-0 overflow-hidden rounded-xl border print:break-inside-avoid ${
            tile.flush ? 'p-0' : 'p-7 sm:p-9'
          } ${SM[sm[i]]} ${LG[lg[i]]}`}
        >
          {tile.node}
        </li>
      ))}
    </ul>
  );
}

// A tile with a small heading, the way every section of the theme is labelled.
function Labelled({
  id,
  title,
  children,
  hidden = false,
}: {
  id: string;
  title: string;
  children: ReactNode;
  hidden?: boolean; // the label is for screen readers only
}) {
  return (
    <section aria-labelledby={id} className="flex h-full min-w-0 flex-col">
      <h2 id={id} className={hidden ? 'sr-only' : 'mb-4 text-sm font-semibold text-muted'}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// The page's own heading, small and big: who it belongs to, then what it is.
function TitleTile({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-end gap-3">
      <p className="text-sm font-semibold text-muted">{kicker}</p>
      <h1
        id={id}
        className={`${display} ${wrap} text-[clamp(2.25rem,7vw,4.5rem)] leading-[1.02] font-semibold tracking-tight text-balance`}
      >
        {title}
      </h1>
      {children}
    </div>
  );
}

// An image from Cloudinary with its size, so the space is kept before it loads. The first image of a
// page is the one the visitor waits for: it loads at once; the others when they come near.
function Picture({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  );
}

// ---- pieces shared by the pages

// The small identity tile of every page but Home: the photo, the name (a link home), the line.
function identityMini(profile: PublicProfile, header: HeaderModel, span = 2): BentoTile {
  return {
    key: 'who',
    span,
    tone: 'solid',
    node: (
      <div className="flex h-full min-w-0 flex-col justify-between gap-6">
        <Avatar
          avatar={header.avatar}
          className="size-16 rounded-lg sm:size-20"
          placeholderClassName={`${display} bg-surface text-2xl font-semibold text-ink`}
        />
        <div className="min-w-0">
          <p className={`${display} ${wrap} text-lg leading-snug font-semibold`}>
            <Link href={rootOf(profile)} className={focusRing}>
              {header.name}
            </Link>
          </p>
          {header.tagline && (
            <p className="mt-1 text-sm leading-snug text-pretty opacity-90">{header.tagline}</p>
          )}
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="mt-3 text-sm"
            dotClassName="bg-accent-fg"
            linkClassName={`font-semibold underline underline-offset-2 hover:no-underline ${focusRing}`}
          />
        </div>
      </div>
    ),
  };
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className={`${chip} ${wrap}`}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

// A project as a tile: the cover, the title that leads to its own page (the whole tile is the link),
// a few lines, the technologies and the project elsewhere. `hero` lays the cover beside the text.
function projectTile(
  project: ProjectEntry,
  options: {
    idPrefix: string;
    locale: string;
    span: number;
    label: string | null; // the section's name, said once on the first tile
    sectionLabel: string; // the same, for the tiles that do not show it
    hero?: boolean;
    priority?: boolean;
    visit: string;
  },
): BentoTile {
  const id = `${options.idPrefix}project-${project.id}`;
  const cover = project.cover && (
    <Picture
      src={project.cover.src}
      alt={project.cover.alt}
      width={project.cover.width}
      height={project.cover.height}
      priority={options.priority}
      className={`h-auto w-full rounded-lg object-cover ${
        options.hero ? 'aspect-[16/10] md:mb-0' : 'aspect-[40/21]'
      } mb-4`}
    />
  );
  return {
    key: id,
    span: options.span,
    tone: 'plain',
    node: (
      <section
        aria-labelledby={id}
        className={`flex h-full min-w-0 flex-col ${
          options.hero ? 'md:grid md:grid-cols-2 md:items-center md:gap-8' : ''
        }`}
      >
        {cover}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className={options.label ? 'mb-3 text-sm font-semibold text-muted' : 'sr-only'}>
            {options.label ?? options.sectionLabel}
          </p>
          <h2
            id={id}
            className={`${display} ${wrap} flex items-start justify-between gap-3 leading-snug font-semibold ${
              options.hero ? 'text-3xl sm:text-4xl' : 'text-xl'
            }`}
          >
            <Link href={project.detailHref} className={`min-w-0 ${stretched}`}>
              {project.name}
            </Link>
            <ArrowUpRight
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 text-muted rtl:-scale-x-100"
            />
          </h2>
          {project.description && (
            <ReadMore
              text={project.description}
              locale={options.locale}
              lines={options.hero ? 5 : 3}
              className={`${wrap} mt-3 flex-1 leading-relaxed text-muted`}
            />
          )}
          {project.tags.length > 0 && (
            <div className="mt-5">
              <Tags tags={options.hero ? project.tags : project.tags.slice(0, 5)} />
            </div>
          )}
          <ProjectVisit
            project={project}
            label={options.visit}
            className={`text-sm font-semibold underline underline-offset-4 hover:no-underline ${focusRing}`}
          />
        </div>
      </section>
    ),
  };
}

// The links, the vCard and the resume of the owner, with Share: the tile Home shows beside the identity.
function linksTile(header: HeaderModel, idPrefix: string, title: string): BentoTile {
  const link = `flex max-w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface ${focusRing}`;
  return {
    key: 'links',
    span: 2,
    tone: 'solid',
    node: (
      <Labelled id={`${idPrefix}bento-links`} title={title}>
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
        <div className="mt-auto pt-4 print:hidden">
          <ShareButton {...header.share} ui={header.ui.share} variant="inverse" />
        </div>
      </Labelled>
    ),
  };
}

// The rhythm of the single page: every third plain tile a little stronger.
function rhythm(tiles: BentoTile[], from: number): BentoTile[] {
  return tiles.map((tile, i) =>
    i >= from && tile.tone === 'plain' && i % 3 === 1 ? { ...tile, tone: 'strong' } : tile,
  );
}

// ---- Home: the identity, a few projects, a short About and the way to reach the owner

function homeTiles(
  profile: PublicProfile,
  model: HomeModel,
  idPrefix: string,
  blockTiles: BentoPagesProps['blockTiles'],
): BentoTile[] {
  const { header } = model;
  const ui = uiFor(profile.locale);
  const t = translatorFor(profile.locale);
  const tiles: BentoTile[] = [];

  tiles.push({
    key: 'identity',
    span: 4,
    tone: 'strong',
    node: (
      <div className="flex h-full min-w-0 flex-col justify-between gap-8">
        <Avatar
          avatar={header.avatar}
          className="size-24 rounded-xl sm:size-32"
          placeholderClassName={`${display} bg-accent text-4xl font-semibold text-on-accent`}
        />
        <div className="min-w-0">
          {header.location && (
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span>{header.location}</span>
            </p>
          )}
          <h1
            className={`${display} ${wrap} text-[clamp(2.25rem,7vw,4.25rem)] leading-[1.03] font-semibold tracking-tight text-balance`}
          >
            {header.name}
          </h1>
          {header.tagline && (
            <p className="mt-3 max-w-xl text-lg leading-snug text-pretty text-muted sm:text-xl">
              {header.tagline}
            </p>
          )}
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="mt-5 w-fit rounded-lg bg-surface px-3.5 py-2.5 text-sm text-ink"
            dotClassName="bg-accent-fg"
            linkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          />
          {header.work && (
            <WorkCard
              work={header.work}
              className="mt-4 w-full max-w-sm rounded-lg bg-surface px-4 py-3.5 text-ink"
              linkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`rounded-full border border-line px-3 py-1 text-xs font-semibold hover:bg-page ${focusRing}`}
            />
          )}
        </div>
      </div>
    ),
  });
  tiles.push(linksTile(header, idPrefix, header.links.length > 0 ? ui.pages.links : 'Share'));

  // The featured projects: the first is the largest, with its cover beside its text.
  const spans = [4, 2, 3, 3];
  model.featured.forEach((project, i) => {
    tiles.push(
      projectTile(project, {
        idPrefix,
        locale: profile.locale,
        span: model.featured.length === 1 ? 6 : (spans[i] ?? 3),
        label: i === 0 ? ui.sections.projects : null,
        sectionLabel: ui.sections.projects,
        hero: model.featured.length === 1,
        visit: ui.viewProject,
      }),
    );
  });
  if (model.work) {
    const { href, label } = model.work;
    tiles.push({
      key: 'all-work',
      span: 2,
      tone: 'solid',
      node: (
        <div className="flex h-full min-w-0 flex-col justify-between gap-8">
          <p aria-hidden="true" className={`${display} text-6xl leading-none font-semibold`}>
            {String(model.projectTotal).padStart(2, '0')}
          </p>
          <p className="flex items-center justify-between gap-3 text-lg font-semibold">
            <Link href={href} className={stretched}>
              {label}
              <span className="sr-only">
                {' '}
                ({t('pages.projectCount', { count: model.projectTotal })})
              </span>
            </Link>
            <ArrowRight aria-hidden="true" className="size-5 shrink-0 rtl:-scale-x-100" />
          </p>
        </div>
      ),
    });
  }

  if (model.now) {
    const { role, company, since, open } = model.now;
    tiles.push({
      key: 'now',
      span: 2,
      tone: 'plain',
      node: (
        <Labelled id={`${idPrefix}now`} title={ui.pages.now}>
          <p className={`${display} ${wrap} text-xl leading-snug font-semibold`}>
            {fill(ui.pages.atCompany, { role, company })}
          </p>
          {open && (
            <p className="mt-2 text-sm text-muted tabular-nums">
              {fill(ui.pages.since, { date: formatMonthYear(since, profile.locale) })}
            </p>
          )}
        </Labelled>
      ),
    });
  }
  if (model.skills.length > 0) {
    tiles.push({
      key: 'skills',
      span: 4,
      tone: 'plain',
      node: (
        <Labelled id={`${idPrefix}skills`} title={ui.sections.skills}>
          <Tags tags={model.skills} />
          {model.skillsTotal > model.skills.length && (
            <p className="mt-3 text-sm text-muted">
              {model.about?.href ? (
                <Link
                  href={model.about.href}
                  className={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
                >
                  {fill(ui.pages.skillsMore, { count: model.skillsTotal - model.skills.length })}
                </Link>
              ) : (
                fill(ui.pages.skillsMore, { count: model.skillsTotal - model.skills.length })
              )}
            </p>
          )}
        </Labelled>
      ),
    });
  }
  if (model.about) {
    tiles.push({
      key: 'about',
      span: 4,
      tone: 'plain',
      node: (
        <Labelled id={`${idPrefix}about`} title={model.aboutTitle}>
          <ReadMore
            text={model.about.text}
            locale={profile.locale}
            from={900}
            lines={9}
            className={`${wrap} text-lg leading-relaxed`}
          />
          {model.about.href && (
            <MoreLinkView more={{ href: model.about.href, label: model.about.label }} />
          )}
        </Labelled>
      ),
    });
  }
  if (model.testimonial) {
    const quote = model.testimonial;
    tiles.push({
      key: 'quote',
      span: 2,
      tone: 'strong',
      node: (
        <figure className="flex h-full min-w-0 flex-col">
          <span
            aria-hidden="true"
            className={`${display} block h-9 text-6xl leading-[0.9] font-semibold text-accent-fg`}
          >
            “
          </span>
          <blockquote className={`${wrap} mt-2 flex-1 text-lg leading-snug whitespace-pre-line`}>
            {quote.message.length > 280 ? `${quote.message.slice(0, 277)}…` : quote.message}
          </blockquote>
          <figcaption className="mt-5 text-sm">
            <span className="block font-semibold">{quote.name}</span>
            {quote.detail && <span className="block text-muted">{quote.detail}</span>}
          </figcaption>
        </figure>
      ),
    });
  }
  if (model.writing) tiles.push(...blockTiles(model.writing));

  if (model.more) {
    tiles.push({
      key: 'more',
      span: 6,
      tone: 'plain',
      node: <MoreLinkView more={model.more} className="text-center" />,
    });
  }
  if (model.cta) {
    const { title, text, href, label } = model.cta;
    tiles.push({
      key: 'cta',
      span: 6,
      tone: 'solid',
      node: (
        <section
          aria-labelledby={`${idPrefix}cta`}
          className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="min-w-0">
            <h2
              id={`${idPrefix}cta`}
              className={`${display} ${wrap} text-3xl leading-tight font-semibold text-balance sm:text-5xl`}
            >
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-lg leading-snug">{text}</p>
          </div>
          <Link
            href={href}
            className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-page px-6 py-3 text-base font-semibold text-ink transition-opacity hover:opacity-90 sm:self-auto print:hidden ${focusRing}`}
          >
            {label}
            <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </Link>
        </section>
      ),
    });
  }
  if (model.contact) tiles.push(...blockTiles(model.contact));
  return tiles;
}

// ---- Work: every project, the first one leading

const WORK_SPANS = [3, 3, 2, 2, 2];

function workTiles(
  profile: PublicProfile,
  model: WorkPageModel,
  idPrefix: string,
  blockTiles: BentoPagesProps['blockTiles'],
): BentoTile[] {
  const ui = uiFor(profile.locale);
  const t = translatorFor(profile.locale);
  const id = `${idPrefix}title`;
  const tiles: BentoTile[] = [
    {
      key: 'title',
      span: 4,
      tone: 'strong',
      node: (
        <TitleTile
          id={id}
          kicker={t('pages.projectCount', { count: model.projects.length })}
          title={model.title}
        >
          {model.intro && (
            <p className="max-w-xl text-lg leading-snug text-pretty text-muted">{model.intro}</p>
          )}
        </TitleTile>
      ),
    },
    identityMini(profile, model.header),
  ];
  if (model.tags.length > 0) {
    tiles.push({
      key: 'tags',
      span: 6,
      tone: 'plain',
      node: (
        <Labelled id={`${idPrefix}tags`} title={ui.pages.tagsLabel}>
          <Tags tags={model.tags.map((tag) => tag.name)} />
        </Labelled>
      ),
    });
  }
  // What the owner ordered before the projects (the jobs, say) comes first.
  tiles.push(...rhythm(model.before.flatMap(blockTiles), 0));
  const hero = model.projects.length >= 3;
  model.projects.forEach((project, i) => {
    tiles.push(
      projectTile(project, {
        idPrefix,
        locale: profile.locale,
        span: i === 0 && hero ? 6 : WORK_SPANS[(hero ? i - 1 : i) % WORK_SPANS.length],
        label: null,
        sectionLabel: ui.sections.projects,
        hero: i === 0 && hero,
        priority: i === 0,
        visit: ui.viewProject,
      }),
    );
  });
  // The jobs and whatever else the owner put on the Work page, after the projects.
  tiles.push(...rhythm(model.blocks.flatMap(blockTiles), 0));
  return tiles;
}

// ---- a project: a case study in tiles

function projectPageTiles(
  profile: PublicProfile,
  model: ProjectPageModel,
  idPrefix: string,
): BentoTile[] {
  const ui = uiFor(profile.locale);
  const id = `${idPrefix}title`;
  const tiles: BentoTile[] = [
    {
      key: 'title',
      span: 4,
      tone: 'strong',
      node: (
        <div className="flex h-full min-w-0 flex-col justify-between gap-6">
          <Breadcrumbs crumbs={model.crumbs} label={ui.pages.breadcrumbs} />
          <TitleTile
            id={id}
            kicker={fill(ui.pages.projectOf, { n: model.position, total: model.total })}
            title={model.name}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      span: 2,
      tone: 'solid',
      node: (
        <Labelled id={`${idPrefix}actions`} title={ui.pages.details}>
          <ul className="space-y-3">
            {model.external && (
              <li>
                <NewTabLink
                  href={model.external}
                  context={model.name}
                  className={`flex items-center justify-between gap-3 rounded-md bg-surface px-4 py-3 text-sm font-semibold ${focusRing}`}
                >
                  {ui.pages.visit}
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 rtl:-scale-x-100" />
                </NewTabLink>
              </li>
            )}
            <li className="print:hidden">
              <ShareButton
                {...model.share}
                ui={model.header.ui.share}
                newTab={model.header.ui.newTab}
                variant="inverse"
              />
            </li>
          </ul>
        </Labelled>
      ),
    },
  ];
  if (model.cover) {
    tiles.push({
      key: 'cover',
      span: 6,
      tone: 'plain',
      flush: true,
      node: (
        <Picture
          src={model.cover.src}
          alt={model.cover.alt || model.name}
          width={model.cover.width}
          height={model.cover.height}
          priority
          className="h-auto w-full object-cover"
        />
      ),
    });
  }
  if (model.description) {
    tiles.push({
      key: 'description',
      span: model.tags.length > 0 ? 4 : 6,
      tone: 'plain',
      node: (
        <Labelled id={`${idPrefix}about-project`} title={ui.pages.caseStudy}>
          <p className={`${wrap} max-w-[68ch] text-lg leading-relaxed whitespace-pre-line`}>
            {model.description}
          </p>
        </Labelled>
      ),
    });
  }
  if (model.tags.length > 0) {
    tiles.push({
      key: 'tech',
      span: 2,
      tone: 'strong',
      node: (
        <Labelled id={`${idPrefix}tech`} title={ui.pages.technologies}>
          <Tags tags={model.tags} />
        </Labelled>
      ),
    });
  }
  const gallerySpans = [3, 3, 2, 2, 2, 6];
  model.gallery.forEach((image, i) => {
    tiles.push({
      key: `image-${image.id}`,
      span: gallerySpans[i % gallerySpans.length],
      tone: 'plain',
      flush: true,
      node: (
        <figure className="min-w-0">
          {i === 0 && <p className="sr-only">{ui.pages.gallery}</p>}
          <Picture
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="h-auto w-full object-cover"
          />
        </figure>
      ),
    });
  });
  const neighbour = (
    which: 'previous' | 'next',
    item: NonNullable<ProjectPageModel['previous']>,
  ): BentoTile => ({
    key: which,
    span: 2,
    tone: 'plain',
    node: (
      <div className={`flex h-full min-w-0 flex-col gap-3 ${which === 'next' ? 'text-end' : ''}`}>
        <p
          className={`flex items-center gap-1.5 text-sm font-semibold text-muted ${
            which === 'next' ? 'justify-end' : ''
          }`}
        >
          {which === 'previous' && (
            <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          )}
          {which === 'previous' ? ui.pages.previous : ui.pages.next}
          {which === 'next' && (
            <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          )}
        </p>
        <p className={`${display} ${wrap} text-xl leading-snug font-semibold`}>
          <Link href={item.href} rel={which === 'next' ? 'next' : 'prev'} className={stretched}>
            {item.name}
          </Link>
        </p>
      </div>
    ),
  });
  const around: BentoTile[] = [];
  if (model.previous) around.push(neighbour('previous', model.previous));
  around.push({
    key: 'back',
    span: 2,
    tone: 'solid',
    node: (
      <p className="flex h-full min-w-0 items-end text-lg font-semibold">
        <Link href={model.back.href} className={`flex items-center gap-2 ${stretched}`}>
          <ArrowLeft aria-hidden="true" className="size-5 shrink-0 rtl:-scale-x-100" />
          {fill(ui.pages.backTo, { page: model.back.label })}
        </Link>
      </p>
    ),
  });
  if (model.next) around.push(neighbour('next', model.next));
  tiles.push(...around);
  return tiles;
}

// ---- About: the photo, the owner's words, the facts, then everything else in the theme's tiles

function aboutTiles(
  profile: PublicProfile,
  model: AboutPageModel,
  idPrefix: string,
  blockTiles: BentoPagesProps['blockTiles'],
): BentoTile[] {
  const ui = uiFor(profile.locale);
  const { header } = model;
  const tiles: BentoTile[] = [
    {
      key: 'portrait',
      span: 2,
      tone: 'strong',
      flush: true,
      node: (
        <Avatar
          avatar={header.avatar}
          className="aspect-square w-full"
          placeholderClassName={`${display} bg-accent text-8xl font-semibold text-on-accent`}
        />
      ),
    },
    {
      key: 'title',
      span: 4,
      tone: 'plain',
      node: (
        <div className="flex h-full min-w-0 flex-col gap-5">
          <TitleTile id={`${idPrefix}title`} kicker={header.name} title={model.title} />
          {(model.text ?? header.tagline) && (
            <ReadMore
              text={model.text ?? header.tagline ?? ''}
              locale={profile.locale}
              from={900}
              lines={9}
              className={`${wrap} text-lg leading-relaxed sm:text-xl`}
            />
          )}
        </div>
      ),
    },
  ];
  model.facts.forEach((fact, i) => {
    tiles.push({
      key: `fact-${i}`,
      span: 2,
      tone: i % 2 === 0 ? 'strong' : 'plain',
      node: (
        <div className="flex h-full min-w-0 flex-col justify-between gap-6">
          <p className="text-sm font-semibold text-muted">{fact.label}</p>
          <p className={`${display} ${wrap} text-2xl leading-tight font-semibold text-balance`}>
            {fact.value}
          </p>
        </div>
      ),
    });
  });
  if (header.links.length > 0 || header.resume || header.contact) {
    tiles.push({
      key: 'reach',
      span: model.facts.length % 3 === 1 ? 4 : 6,
      tone: 'solid',
      node: (
        <Labelled id={`${idPrefix}reach`} title={ui.pages.reach}>
          <ul className="flex flex-wrap gap-2.5">
            {header.links.map((link) => (
              <li key={link.id} className="max-w-full">
                <HeaderLink
                  link={link}
                  className={`inline-flex max-w-full items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold ${focusRing}`}
                />
              </li>
            ))}
            {header.contact && (
              <li className="print:hidden">
                <ContactLink
                  contact={header.contact}
                  className={`inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold ${focusRing}`}
                />
              </li>
            )}
            {header.resume && (
              <li>
                <ResumeLink
                  resume={header.resume}
                  className={`inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold ${focusRing}`}
                />
              </li>
            )}
          </ul>
        </Labelled>
      ),
    });
  }
  const sections = rhythm(model.blocks.flatMap(blockTiles), 0);
  return [...tiles, ...sections];
}

// ---- Contact: ways to reach the owner as big tiles, and the form open

function contactTiles(
  profile: PublicProfile,
  model: ContactPageModel,
  idPrefix: string,
): BentoTile[] {
  const ui = uiFor(profile.locale);
  const { header } = model;
  const tiles: BentoTile[] = [
    {
      key: 'title',
      span: 4,
      tone: 'strong',
      node: (
        <TitleTile id={`${idPrefix}title`} kicker={header.name} title={model.title}>
          <p className="max-w-xl text-lg leading-snug text-pretty text-muted">
            {model.form ? model.intro : ui.pages.contactIntro}
          </p>
        </TitleTile>
      ),
    },
    header.availability
      ? {
          key: 'availability',
          span: 2,
          tone: 'solid',
          node: (
            <Labelled id={`${idPrefix}availability`} title={ui.pages.factAvailability}>
              <AvailabilityBadge
                availability={header.availability}
                ui={header.ui}
                className="text-lg leading-snug font-semibold"
                dotClassName="bg-accent-fg"
                linkClassName={`underline underline-offset-2 ${focusRing}`}
              />
            </Labelled>
          ),
        }
      : identityMini(profile, header),
  ];

  const big = `flex min-h-28 flex-col justify-between gap-6 text-lg font-semibold ${wrap} ${stretched}`;
  header.links.forEach((link, i) => {
    tiles.push({
      key: `link-${link.id}`,
      span: 2,
      tone: i % 3 === 1 ? 'strong' : 'plain',
      node: (
        <div className="flex h-full min-w-0 flex-col">
          {i === 0 && <p className="mb-3 text-sm font-semibold text-muted">{ui.pages.reach}</p>}
          <HeaderLink link={link} className={big} />
        </div>
      ),
    });
  });
  if (header.contact) {
    tiles.push({
      key: 'vcard',
      span: 2,
      tone: 'plain',
      node: <ContactLink contact={header.contact} className={big} />,
    });
  }
  if (header.resume) {
    tiles.push({
      key: 'resume',
      span: 2,
      tone: 'plain',
      node: <ResumeLink resume={header.resume} className={big} />,
    });
  }
  if (model.work) {
    tiles.push({
      key: 'work-card',
      span: 3,
      tone: 'strong',
      node: (
        <WorkCard
          work={model.work}
          className="h-full text-ink"
          linkClassName={`font-semibold text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          buttonClassName={`rounded-full border border-line px-3 py-1 text-xs font-semibold hover:bg-page ${focusRing}`}
        />
      ),
    });
  }
  if (model.form) {
    tiles.push({
      key: 'form',
      span: 6,
      tone: 'plain',
      node: (
        <Labelled id={`${idPrefix}form`} title={ui.sections.contact}>
          <div className="max-w-xl print:hidden">
            <ContactForm
              form={model.form}
              page={model.state ?? undefined}
              buttonClassName={`inline-flex items-center rounded-full border border-line bg-page/70 px-5 py-2 text-sm font-semibold transition-colors hover:bg-page ${focusRing}`}
            />
          </div>
        </Labelled>
      ),
    });
  }
  return tiles;
}

// ---- a page the owner made

function customTiles(
  profile: PublicProfile,
  model: CustomPageModel,
  idPrefix: string,
  blockTiles: BentoPagesProps['blockTiles'],
): BentoTile[] {
  const tiles: BentoTile[] = [
    {
      key: 'title',
      span: 4,
      tone: 'strong',
      node: <TitleTile id={`${idPrefix}title`} kicker={model.header.name} title={model.title} />,
    },
    identityMini(profile, model.header),
  ];
  if (model.body) {
    tiles.push({
      key: 'body',
      span: 6,
      tone: 'plain',
      node: (
        <div
          className={`${wrap} max-w-[68ch] text-lg leading-relaxed [&_.wr-display]:font-(family-name:--font-theme-display) [&_a]:font-semibold [&_a]:text-accent-fg [&_a]:underline [&_p+p]:mt-4`}
        >
          <Markdown>{model.body}</Markdown>
        </div>
      ),
    });
  }
  return [...tiles, ...rhythm(model.blocks.flatMap(blockTiles), 0)];
}

// ---- the page

export function BentoPages({
  profile,
  view,
  nav,
  idPrefix,
  tiles,
  fontClass,
  vars,
  footer,
  blockTiles,
}: BentoPagesProps) {
  let items: BentoTile[];
  switch (view.kind) {
    case 'home':
      items = rhythm(homeTiles(profile, view, idPrefix, blockTiles), 2);
      break;
    case 'work':
      items = workTiles(profile, view, idPrefix, blockTiles);
      break;
    case 'project':
      items = projectPageTiles(profile, view, idPrefix);
      break;
    case 'about':
      items = aboutTiles(profile, view, idPrefix, blockTiles);
      break;
    case 'contact':
      items = contactTiles(profile, view, idPrefix);
      break;
    case 'custom':
      items = customTiles(profile, view, idPrefix, blockTiles);
      break;
  }
  return (
    <ThemeWrapper theme="bento" profile={profile} nav={nav} className={fontClass} vars={vars}>
      <div data-tiles={tiles}>
        <main id={`${idPrefix}main`} className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <Grid tiles={items} />
        </main>
        {footer}
      </div>
    </ThemeWrapper>
  );
}
