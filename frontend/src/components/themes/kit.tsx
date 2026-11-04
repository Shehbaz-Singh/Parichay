import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { fill } from '@/lib/i18n';
import type { Block, Entry, ProjectEntry } from './blocks';
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

export function Container({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'main' | 'header' | 'footer';
}) {
  return (
    <Tag className={cx('mx-auto w-full max-w-[var(--container,72rem)] px-(--gutter)', className)}>
      {children}
    </Tag>
  );
}

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

// A line of small facts: "Lisbon · Open to work · 8 years". Separators are decoration.
export function MetaRow({
  items,
  className,
}: {
  items: (ReactNode | null | undefined | false)[];
  className?: string;
}) {
  const shown = items.filter(Boolean);
  if (shown.length === 0) return null;
  return (
    <ul className={cx('pt-small flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      {shown.map((item, i) => (
        <li key={i} className="flex items-baseline gap-2">
          {i > 0 && <span aria-hidden="true">·</span>}
          {item}
        </li>
      ))}
    </ul>
  );
}

// Links in a row that wraps. Each child is a complete link; the row only spaces them.
export function LinkRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('pt-small flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {children}
    </div>
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

export const EducationItem = ExperienceItem;

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
