import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { fill } from '@/lib/i18n';
import type { Block, Entry, FooterModel, HeaderModel, ProjectEntry } from './blocks';
import { GIANT_NAME, bulletsOf, nameScale, type Piece } from './copy';
import { Collapse } from './Collapse';
import {
  DateRange,
  NewTabLink,
  ProjectCover,
  ProjectVisit,
  RoleList,
  TotalExperience,
} from './parts';
import { ReadMore } from './ReadMore';

// The layout primitives every public theme is built from. They carry the shared type steps, measure
// and spacing (app/public-type.css) and the structure (headings, lists, the one expander); a theme
// differs by its layout, colors, fonts and one signature element, and passes those as class names.
// Nothing here sets a color or a font family, and no size outside the shared steps.

type Cx = string | false | null | undefined;
const cx = (...names: Cx[]) => names.filter(Boolean).join(' ');

export function SectionHeading({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={cx('pt-h2 break-after-avoid font-semibold', className)}>
      {children}
    </h2>
  );
}

// A section: its heading, then the content a gap below. The gap between sections is the shared one.
export function Section({
  id,
  title,
  className,
  headingClassName,
  gapClassName = 'mt-5',
  children,
}: {
  id: string;
  title: string;
  className?: string;
  headingClassName?: string;
  gapClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cx('py-(--section-y) first:pt-0 print:break-inside-auto print:py-4', className)}
    >
      <SectionHeading id={id} className={headingClassName}>
        {title}
      </SectionHeading>
      <div className={gapClassName}>{children}</div>
    </section>
  );
}

// The one way to fold away what most visitors will not read. Native button, aria-expanded, and the
// folded content stays in the page (see Collapse.tsx).
export function Expander({
  label,
  closeLabel,
  className,
  children,
}: {
  label: string;
  closeLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Collapse
      className={cx('mt-6', className)}
      label={label}
      closeLabel={closeLabel}
      buttonClassName="pt-small inline-block min-h-6 font-semibold text-accent-fg underline underline-offset-2 hover:no-underline print:hidden"
    >
      {children}
    </Collapse>
  );
}

export interface ItemClasses {
  list?: string;
  item?: string;
  title?: string; // the role or degree
  org?: string; // the company or school
  dates?: string;
  body?: string; // the description
}

// A job, a degree or a custom entry: what, where, when (with its computed length) and what was done.
// The description is paragraphs or real bullets (lib/description.ts), at the shared measure.
export function ExperienceItem({
  entry,
  openEnded,
  classes = {},
  titleTag: Title = 'h3',
  hang = false,
  marker,
}: {
  entry: Entry;
  openEnded: boolean;
  classes?: ItemClasses;
  titleTag?: 'h3' | 'h4';
  marker?: ReactNode; // a decoration drawn first in the item (a timeline dot)
  hang?: boolean; // dates hang in a left column beside the entry (from 768px) instead of sitting on the title line
}) {
  const dates = entry.start && (
    <p
      className={cx(
        'pt-small pt-date',
        hang ? 'mb-1 md:mt-1.5 md:mb-0' : 'shrink-0 sm:whitespace-nowrap',
        classes.dates,
      )}
    >
      <DateRange
        start={entry.start}
        end={entry.end}
        openEnded={openEnded}
        duration={entry.duration}
        fmt={entry.fmt}
      />
    </p>
  );
  return (
    <li
      className={cx(
        'min-w-0 break-inside-avoid',
        hang && entry.start && 'md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:gap-x-8',
        classes.item,
      )}
    >
      {marker}
      {hang && dates}
      <div className="min-w-0">
        <div className="flex flex-col gap-x-6 sm:flex-row sm:items-baseline sm:justify-between">
          <Title className={cx('pt-h3 pt-name font-semibold', classes.title)}>{entry.title}</Title>
          {!hang && dates}
        </div>
        {entry.subtitle && (
          <p className={cx('pt-name font-medium', classes.org)}>{entry.subtitle}</p>
        )}
        {entry.roles && (
          <RoleList
            roles={entry.roles}
            className="mt-3 space-y-(--item-gap) border-s border-line ps-4"
            roleClassName="break-inside-avoid"
            titleClassName="pt-body pt-name font-semibold"
            datesClassName={cx('pt-small pt-date', classes.dates)}
            descriptionClassName={cx('mt-1 pt-body', classes.body)}
          />
        )}
        {entry.description && (
          <ReadMore
            text={entry.description}
            locale={entry.fmt.locale}
            className={cx('mt-2 pt-body', classes.body)}
          />
        )}
        {entry.href && (
          <p className="pt-small mt-2">
            <NewTabLink
              href={entry.href}
              context={entry.title}
              className="text-accent-fg underline underline-offset-2 hover:no-underline"
            >
              View
            </NewTabLink>
          </p>
        )}
      </div>
    </li>
  );
}

// The whole 'entries' block: total experience (only when worked out from real dates), the shown
// entries, then the earlier ones behind the expander, or a link to the page with all of them.
export function EntryList({
  block,
  classes = {},
  totalClassName,
  hang,
  marker,
}: {
  block: Extract<Block, { kind: 'entries' }>;
  classes?: ItemClasses;
  totalClassName?: string;
  hang?: boolean;
  marker?: ReactNode;
}) {
  const openEnded = block.variant !== 'custom';
  const list = (items: Entry[]) => (
    <ol className={classes.list ?? 'space-y-(--item-gap)'}>
      {items.map((entry) => (
        <ExperienceItem
          key={entry.id}
          entry={entry}
          openEnded={openEnded}
          classes={classes}
          hang={hang}
          marker={marker}
        />
      ))}
    </ol>
  );
  return (
    <>
      <TotalExperience
        total={block.total}
        label={block.ui.totalExperience}
        className={cx('pt-small mb-4', totalClassName)}
      />
      {list(block.entries)}
      {block.variant === 'experience' && block.rest.length > 0 && (
        <Expander
          label={fill(block.ui.density.earlierRoles, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
        >
          <div className="mt-(--item-gap)">{list(block.rest)}</div>
        </Expander>
      )}
    </>
  );
}

export interface ProjectClasses {
  list?: string;
  item?: string;
  title?: string;
  body?: string;
  meta?: string;
  link?: string;
  cover?: string;
}

// A project as text first: name, what it was, its tools, and the way on. The cover is optional.
export function ProjectItem({
  project,
  block,
  classes = {},
}: {
  project: ProjectEntry;
  block: Extract<Block, { kind: 'projects' }>;
  classes?: ProjectClasses;
}) {
  return (
    <li className={cx('min-w-0 break-inside-avoid', classes.item)}>
      <ProjectCover
        project={project}
        className={cx('mb-3 h-auto w-full max-w-sm print:hidden', classes.cover)}
      />
      <h3 className={cx('pt-h3 pt-name font-semibold', classes.title)}>
        <Link
          href={project.detailHref}
          className={
            classes.link ?? 'text-accent-fg underline underline-offset-2 hover:no-underline'
          }
        >
          {project.name}
        </Link>
      </h3>
      {project.description && (
        <ReadMore
          text={project.description}
          locale={block.locale}
          className={cx('mt-1 pt-body', classes.body)}
        />
      )}
      {project.builtAt && (
        <p className={cx('pt-small mt-1', classes.meta)}>
          {fill(block.ui.builtAt, { company: project.builtAt })}
        </p>
      )}
      {project.tags.length > 0 && (
        <p className={cx('pt-small mt-1', classes.meta)}>{project.tags.join(' · ')}</p>
      )}
      <ProjectVisit
        project={project}
        label={block.ui.viewProject}
        className={cx(
          'pt-small inline-flex items-baseline gap-1',
          classes.link ?? 'text-accent-fg underline underline-offset-2 hover:no-underline',
        )}
      >
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 shrink-0 self-center rtl:-scale-x-100 print:hidden"
        />
      </ProjectVisit>
    </li>
  );
}

export function ProjectList({
  block,
  classes = {},
}: {
  block: Extract<Block, { kind: 'projects' }>;
  classes?: ProjectClasses;
}) {
  const list = (items: ProjectEntry[]) => (
    <ul className={classes.list ?? 'space-y-(--item-gap)'}>
      {items.map((project) => (
        <ProjectItem key={project.id} project={project} block={block} classes={classes} />
      ))}
    </ul>
  );
  return (
    <>
      {list(block.projects)}
      {block.rest.length > 0 && (
        <Expander
          label={fill(block.ui.density.moreProjects, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
        >
          <div className="mt-(--item-gap)">{list(block.rest)}</div>
        </Expander>
      )}
    </>
  );
}

// Skills as a plain list: shown ones, the rest behind "N more skills". `markerClassName` draws the bullet.
export function SkillList({
  block,
  className,
  itemClassName,
  expanderClassName,
}: {
  block: Extract<Block, { kind: 'skills' }>;
  className?: string;
  itemClassName?: string;
  expanderClassName?: string;
}) {
  const list = (items: typeof block.skills) => (
    <ul className={cx('pt-small', className ?? 'space-y-1.5')}>
      {items.map((skill) => (
        <li key={skill.id} className={cx('pt-name', itemClassName)}>
          {skill.name}
        </li>
      ))}
    </ul>
  );
  return (
    <>
      {list(block.skills)}
      {block.rest.length > 0 && (
        <Expander
          className={cx('mt-3', expanderClassName)}
          label={fill(block.ui.density.moreSkills, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
        >
          <div className="mt-3">{list(block.rest)}</div>
        </Expander>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------------------------------
// The ruled-document pieces, first built for Index and now shared. They are layout and structure only:
// hairline rules, the two-column "title left, text right" grid, and size and weight for hierarchy. A theme
// supplies its colors and fonts through its own variables and the class names passed in.

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
export const wrap = '[overflow-wrap:anywhere]';
// The one plain-text link: underlined, never color alone.
export const textLink = `underline decoration-1 underline-offset-4 hover:decoration-2 ${focusRing}`;
// A label column and a text column that starts at the middle and stops at about 66 characters; one column
// below 1280px, where a side rail leaves too little width for two.
export const splitGrid =
  'grid gap-x-[clamp(2rem,4vw,4rem)] gap-y-8 min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,min(37rem,52%))]';
export const pageGutter = 'px-[clamp(1.25rem,3.2vw,2.75rem)]';
export const ruledSectionY = 'py-[clamp(3.5rem,8vw,8rem)]';

// A top-level section drawn as <div role="region" aria-labelledby> (the same landmark as <section>; the
// shared reveal motion selects `section[aria-labelledby]`, so a theme with no motion on its text opts out by
// using this). The heading sits on a hairline: `split` puts the title left and the content in the narrow
// column; `stack` puts the title above and gives the content the width.
export function RuledSection({
  id,
  number,
  title,
  layout = 'split',
  aside,
  children,
  titleClassName,
}: {
  id: string;
  number?: string; // decorative: aria-hidden
  title: string;
  layout?: 'split' | 'stack';
  aside?: ReactNode; // under the title in the left column, wide screens only
  children: ReactNode;
  titleClassName: string;
}) {
  const heading = (
    <h2 id={id} tabIndex={-1} className={cx(titleClassName, number && 'flex gap-[0.4em]')}>
      {number && (
        <span aria-hidden="true" className="shrink-0 text-accent-fg tabular-nums">
          {number}
        </span>
      )}
      <span className="min-w-0">{title}</span>
    </h2>
  );
  return (
    <div role="region" aria-labelledby={id} className={pageGutter}>
      <div className={cx('border-t border-line', ruledSectionY, layout === 'split' && splitGrid)}>
        {layout === 'split' ? (
          <>
            <div className="min-w-0">
              {heading}
              {aside && <div className="mt-10 hidden min-[1280px]:block">{aside}</div>}
            </div>
            <div className="min-w-0">{children}</div>
          </>
        ) : (
          <>
            <div className="mb-[clamp(2.5rem,5vw,4.5rem)]">{heading}</div>
            {children}
          </>
        )}
      </div>
    </div>
  );
}

// What a job did, as a real list (copy.ts: marked lists stay lists, several lines become one, a long
// paragraph becomes a bullet per sentence). More than `max`+1 bullets fold behind the expander, so ten long
// jobs stay a short page.
export function Bullets({
  pieces,
  max = 5,
  ui,
  className,
}: {
  pieces: Piece[];
  max?: number;
  ui: Block['ui'];
  className?: string;
}) {
  const list = (items: string[]) => (
    <ul
      className={cx(
        'list-disc space-y-2 ps-5 text-[1.0625rem] leading-[1.65] marker:text-accent-fg',
        wrap,
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="ps-1">
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cx('max-w-[66ch] space-y-3', className)}>
      {pieces.map((piece, index) => {
        if (piece.kind === 'p')
          return (
            <p key={index} className={cx('text-[1.0625rem] leading-[1.65]', wrap)}>
              {piece.text}
            </p>
          );
        if (piece.items.length <= max + 1) return <div key={index}>{list(piece.items)}</div>;
        return (
          <div key={index}>
            {list(piece.items.slice(0, max))}
            <Collapse
              className="mt-3"
              label={ui.density.readMore}
              closeLabel={ui.density.readLess}
              buttonClassName={cx('min-h-8 text-[0.9375rem] font-medium print:hidden', textLink)}
            >
              <div className="mt-2">{list(piece.items.slice(max))}</div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}

// An experience entry in the ruled layout: company and title large on the left, the dates small under
// them (tabular figures), the bullets on the right. The strongest block of a page.
export function SplitExperienceItem({
  entry,
  ui,
  openEnded = true,
  titleClassName,
}: {
  entry: Entry;
  ui: Block['ui'];
  openEnded?: boolean;
  titleClassName: string; // the theme's display step
}) {
  return (
    <li className={cx(splitGrid, 'border-t border-line py-[clamp(1.75rem,3.5vw,3rem)]')}>
      <div className="min-w-0">
        <h3 className={cx(titleClassName, wrap)}>{entry.title}</h3>
        {entry.subtitle && (
          <p className={cx('mt-1 text-[clamp(1.125rem,1.5vw,1.3125rem)] leading-snug', wrap)}>
            {entry.subtitle}
          </p>
        )}
        {entry.start && (
          <p className="mt-3 text-[0.875rem] leading-snug text-muted tabular-nums">
            <DateRange
              start={entry.start}
              end={entry.end}
              openEnded={openEnded}
              duration={entry.duration}
              fmt={entry.fmt}
            />
          </p>
        )}
      </div>
      <div className="min-w-0">
        {entry.roles ? (
          <RoleList
            roles={entry.roles}
            className="space-y-8"
            titleClassName="text-[1.0625rem] font-semibold"
            datesClassName="text-[0.875rem] leading-snug text-muted tabular-nums"
            descriptionClassName="mt-3"
          />
        ) : (
          entry.description && <Bullets pieces={bulletsOf(entry.description)} ui={ui} />
        )}
      </div>
    </li>
  );
}

// Images first, in a two-up grid: a 4:3 cover, a small bold title and one line under it. With no cover: a
// typographic one (the name and tags on a pale tint of the accent), never an empty box.
export function ProjectGrid({
  projects,
  titleClassName,
}: {
  projects: ProjectEntry[];
  titleClassName: string; // the theme's display step, for the typographic cover
}) {
  return (
    <ul className="grid gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-[clamp(2.5rem,5vw,4.5rem)] sm:grid-cols-2">
      {projects.map((project) => (
        <li key={project.id} className="relative min-w-0">
          <div className="aspect-[4/3] w-full overflow-hidden bg-accent-soft">
            {project.cover ? (
              <img
                src={project.cover.src}
                alt={project.cover.alt}
                width={project.cover.width}
                height={project.cover.height}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            ) : (
              <div className="ix-panel flex size-full flex-col justify-between bg-accent-soft p-[clamp(1.25rem,2.5vw,2rem)] text-ink">
                <p aria-hidden="true" className={cx(titleClassName, wrap)}>
                  {project.name}
                </p>
                {project.tags.length > 0 && (
                  <p
                    aria-hidden="true"
                    className={cx('line-clamp-2 text-[0.875rem] leading-snug', wrap)}
                  >
                    {project.tags.slice(0, 5).join(' · ')}
                  </p>
                )}
              </div>
            )}
          </div>
          <h3 className={cx('mt-4 text-[1.0625rem] leading-snug font-semibold', wrap)}>
            <Link
              href={project.detailHref}
              className={cx(
                'after:absolute after:inset-0 hover:underline hover:underline-offset-4',
                focusRing,
              )}
            >
              {project.name}
            </Link>
          </h3>
          {(project.description || project.tags.length > 0) && (
            <p className={cx('mt-1 line-clamp-1 text-[0.9375rem] leading-snug text-muted', wrap)}>
              {project.description || project.tags.slice(0, 4).join(' · ')}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

// The footer: the owner's name in the display face, then the links, then the small print.
export function Footer({
  footer,
  resume,
  contactHref,
  contactLabel,
  backLabel,
  topHref,
  nameClassName,
}: {
  footer: FooterModel;
  resume: HeaderModel['resume'];
  contactHref: string | null;
  contactLabel: string;
  backLabel: string;
  topHref: string;
  nameClassName: string; // the theme's display font and tracking
}) {
  const links = cx('inline-flex min-h-10 items-center text-[0.9375rem] font-medium', textLink);
  return (
    <footer className={pageGutter}>
      <div className="border-t border-line pt-[clamp(3rem,7vw,6rem)] pb-10">
        <p
          lang={footer.locale}
          className={cx(
            nameClassName,
            GIANT_NAME[nameScale(footer.name)],
            'leading-[1.05] text-balance [hyphens:none]',
            wrap,
          )}
        >
          {footer.name}
        </p>
        <ul className="mt-[clamp(2rem,4vw,3.5rem)] flex flex-wrap gap-x-8 gap-y-1 print:hidden">
          {resume && (
            <li>
              <a href={resume.href} download className={links}>
                {resume.label}
              </a>
            </li>
          )}
          {contactHref && (
            <li>
              <a href={contactHref} className={links}>
                {contactLabel}
              </a>
            </li>
          )}
          <li>
            <a href={topHref} className={links}>
              {backLabel}
            </a>
          </li>
        </ul>
        <p className={cx('mt-6 text-[0.875rem] leading-snug text-muted', wrap)}>
          © {footer.year} {footer.name}. Made {footer.message}{' '}
          <a href={footer.cta.href} className={cx('font-semibold text-ink', textLink)}>
            {footer.cta.label}
          </a>
        </p>
      </div>
    </footer>
  );
}
