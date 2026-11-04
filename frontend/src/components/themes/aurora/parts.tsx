import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Minus, Plus } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { fill } from '@/lib/i18n';
import type { Block, Entry, FooterModel, HeaderModel, ProjectEntry, WritingEntry } from '../blocks';
import { Collapse } from '../Collapse';
import { ContactForm } from '../ContactForm';
import { ReadMore } from '../ReadMore';
import {
  AvailabilityBadge,
  Avatar,
  ContactLink,
  DateRange,
  HeaderLink,
  LINK_ICONS,
  NewTabLink,
  ProjectCover,
  ResumeLink,
  RoleList,
} from '../parts';
import { WorkCard } from '../WorkCard';
import { ShareButton } from '../../ShareButton';
import { Strip } from './Strip';

// The pieces of the Aurora theme that both the single page and the pages of a multi-page portfolio use.
// Surfaces are the page color and one raised step (.au-card); the accent appears as text, rings, the one
// solid button and the tints behind covers, all from lib/palette/recipes.ts. The glow is in the hero and the
// footer card and nowhere else.

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
export const wrap = '[overflow-wrap:anywhere]';
// Side padding of every section, and the widest a section's content gets.
export const gutter = 'px-[clamp(1rem,5vw,3rem)]';
export const column = 'mx-auto max-w-6xl';
// Headings: tracking is tightened only on large display text (not for a script that joins letters).
export const display = 'au-tight font-bold';
export const h2Class = `${display} pt-h1 scroll-mt-24 outline-none ${wrap}`;

export const primaryButton = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 pt-small font-semibold text-on-accent hover:opacity-90 ${focusRing}`;
export const secondaryButton = `inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 pt-small font-semibold text-ink hover:bg-surface ${focusRing}`;
export const textLink = `font-semibold text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`;
const chipClass = `pt-small rounded-full border border-line px-3 py-1 ${wrap}`;

export const Arrow = ({ className = 'size-4' }: { className?: string }) => (
  <ArrowRight aria-hidden="true" className={`${className} rtl:-scale-x-100`} />
);

// ---- Sections

// A section with its label in a column that stays in view while the content scrolls (desktop), above the
// content on a phone. The heading is an h2 the navigation can move focus to.
export function Split({
  block,
  children,
  id,
  lead = false,
}: {
  block: Pick<Block, 'id' | 'title'>;
  children: ReactNode;
  id?: string;
  lead?: boolean; // Experience: a stronger label
}) {
  return (
    <section
      id={id}
      aria-labelledby={block.id}
      className={`${gutter} border-t border-line py-14 sm:py-20`}
    >
      <div className={`${column} grid gap-8 min-[900px]:grid-cols-[13rem_1fr] min-[900px]:gap-14`}>
        <h2
          id={block.id}
          tabIndex={-1}
          className={`scroll-mt-24 font-semibold outline-none min-[900px]:sticky min-[900px]:top-24 min-[900px]:self-start ${lead ? 'pt-h2' : 'pt-h3'} ${wrap}`}
        >
          {block.title}
        </h2>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

// A section with a large heading above full-width content (work, writing, testimonials).
export function Wide({
  block,
  children,
  action,
}: {
  block: Pick<Block, 'id' | 'title'>;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section aria-labelledby={block.id} className={`${gutter} py-14 sm:py-20`}>
      <div className={column}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <h2 id={block.id} tabIndex={-1} className={h2Class}>
            {block.title}
          </h2>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

// ---- Hero

export function Hero({
  header,
  id,
  primary,
  secondary,
}: {
  header: HeaderModel;
  id: string;
  primary: { href: string; label: string } | null;
  secondary: { href: string; label: string } | null; // used when the owner has no resume to offer
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-label={header.name}
      className="au-hero scroll-mt-20 outline-none"
    >
      <div aria-hidden="true" className="au-glow" />
      <div className={`${gutter} py-20 text-center sm:py-28 min-[900px]:py-32`}>
        <div className="au-scrim mx-auto max-w-4xl px-4 py-10 sm:px-10">
          <h1 className={`${display} pt-display ${wrap}`}>
            <span className="block">{header.name}</span>
            {header.tagline && (
              <span className="pt-h2 mt-2 block font-medium text-muted">{header.tagline}</span>
            )}
          </h1>
          {header.location && (
            <p className={`mx-auto mt-6 max-w-xl pt-body text-muted ${wrap}`}>{header.location}</p>
          )}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 print:hidden">
            {primary && (
              <Link href={primary.href} className={primaryButton}>
                {primary.label}
                <Arrow />
              </Link>
            )}
            {header.resume ? (
              <ResumeLink resume={header.resume} className={secondaryButton} />
            ) : (
              secondary && (
                <Link href={secondary.href} className={secondaryButton}>
                  {secondary.label}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- Bento: the highlights under the hero

export interface BentoModel {
  header: HeaderModel;
  heading: string;
  skills: { names: string[]; total: number; href: string | null; label: string } | null;
  experience: string | null; // the years in all, when there are jobs
}

const tile = 'au-card au-lift fx-item min-w-0 p-5 sm:p-6';
const tileTitle = 'pt-small mb-3 font-semibold text-muted';

export function bentoCount(model: BentoModel): number {
  const { header } = model;
  return (
    [
      model.skills,
      header.availability,
      header.work,
      header.location || model.experience ? true : null,
    ].filter(Boolean).length + 1 // the avatar or monogram tile
  );
}

// The tiles read in this order in the page (about, who, focus, status, details, working together); the grid
// places them with `dense` flow, and is one column on a phone. Only what the owner wrote is in them.
export function Bento({ model, id }: { model: BentoModel; id: string }) {
  const { header, skills } = model;
  const ui = header.ui;
  const facts: { label: string; value: string }[] = [];
  if (header.location) facts.push({ label: ui.pages.factLocation, value: header.location });
  if (model.experience) facts.push({ label: ui.pages.factExperience, value: model.experience });
  return (
    <section aria-labelledby={id} className={`${gutter} pb-14 sm:pb-20`}>
      <div className={column}>
        <h2 id={id} tabIndex={-1} className={`${h2Class} mb-8 sm:mb-10`}>
          {model.heading}
        </h2>
        <ul className="grid [grid-auto-flow:dense] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className={`${tile} flex flex-col items-center justify-center gap-3 text-center`}>
            <Avatar
              avatar={header.avatar}
              className="aspect-square w-full max-w-40 rounded-3xl"
              placeholderClassName="bg-accent-soft pt-title font-bold text-accent-fg"
            />
            {header.tagline && <p className={`pt-small font-semibold ${wrap}`}>{header.tagline}</p>}
          </li>
          {skills && (
            <li className={`${tile} sm:col-span-2 lg:col-span-3`}>
              <h3 className={tileTitle}>{ui.sections.skills}</h3>
              <ul className="flex flex-wrap gap-2">
                {skills.names.map((name) => (
                  <li key={name} className={chipClass}>
                    {name}
                  </li>
                ))}
              </ul>
              {skills.href && skills.total > skills.names.length && (
                <p className="mt-4">
                  <Link
                    href={skills.href}
                    className={`inline-flex items-center gap-1.5 ${textLink}`}
                  >
                    {skills.label}
                    <Arrow />
                  </Link>
                </p>
              )}
            </li>
          )}
          {header.availability && (
            <li className={tile}>
              <AvailabilityBadge
                availability={header.availability}
                ui={ui}
                className="flex-col pt-small text-ink"
                dotClassName="bg-accent"
                linkClassName={textLink}
              />
            </li>
          )}
          {facts.length > 0 && (
            <li className={tile}>
              <dl className="space-y-3">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="pt-small text-muted">{fact.label}</dt>
                    <dd className={`font-semibold ${wrap}`}>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          )}
          {header.work && (
            <li className="min-w-0 sm:col-span-2 [&>*]:h-full">
              <WorkingTogether work={header.work} />
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

export function WorkingTogether({ work }: { work: NonNullable<HeaderModel['work']> }) {
  return (
    <WorkCard
      work={work}
      className="au-card p-5 text-start text-ink sm:p-6"
      linkClassName={textLink}
      buttonClassName={`rounded-full bg-accent px-3.5 py-1.5 pt-fine font-semibold text-on-accent hover:opacity-90 ${focusRing}`}
    />
  );
}

// ---- Work

function ProjectCard({
  project,
  visit,
  tech,
}: {
  project: ProjectEntry;
  visit: string;
  tech: string;
}) {
  const tags = project.tags.slice(0, 3);
  return (
    <li className="au-card au-lift relative flex min-w-0 flex-col overflow-hidden">
      {project.cover ? (
        <ProjectCover project={project} className="aspect-[16/10] w-full object-cover" />
      ) : (
        // No picture: the name set large on a wash of the accent.
        <div
          aria-hidden="true"
          className={`flex aspect-[16/10] w-full items-end bg-accent-soft p-5 text-accent-fg ${wrap}`}
        >
          <span className={`${display} line-clamp-3 pt-h2 `}>
            {project.name}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {tags.length > 0 && (
          <ul aria-label={tech} className="mb-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag} className={`${chipClass} !px-2.5 !py-0.5 !pt-fine text-muted`}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        <h3 className={`pt-body font-semibold ${wrap}`}>
          <Link
            href={project.detailHref}
            className={`after:absolute after:inset-0 hover:underline hover:underline-offset-4 ${focusRing}`}
          >
            {project.name}
          </Link>
        </h3>
        {project.description && (
          <p className={`mt-2 line-clamp-3 pt-body text-muted ${wrap}`}>{project.description}</p>
        )}
        {project.href && (
          <p className="relative z-10 mt-4">
            <NewTabLink
              href={project.href}
              context={project.name}
              className={`inline-flex items-center gap-1 pt-small ${textLink}`}
            >
              {visit}
              <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            </NewTabLink>
          </p>
        )}
      </div>
    </li>
  );
}

// The projects as a strip that scrolls with snap points (a plain grid until the script runs, on a phone and
// in print): the featured ones first, then the others.
export function WorkStrip({
  projects,
  label,
  labels,
}: {
  projects: ProjectEntry[];
  label: string;
  labels: { prev: string; next: string; visit: string; tech: string };
}) {
  return (
    <Strip label={label} prev={labels.prev} next={labels.next}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} visit={labels.visit} tech={labels.tech} />
      ))}
    </Strip>
  );
}

// All the projects as a grid, for the Work page.
export function WorkGrid({
  projects,
  visit,
  tech,
}: {
  projects: ProjectEntry[];
  visit: string;
  tech: string;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} visit={visit} tech={tech} />
      ))}
    </ul>
  );
}

// ---- Experience, education, skills, FAQ

function RoleRow({ entry, locale }: { entry: Entry; locale: string }) {
  return (
    <li className="relative ps-7 pb-10 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute start-0 top-2 size-2.5 -translate-x-[calc(50%+0.5px)] rounded-full bg-accent rtl:translate-x-[calc(50%+0.5px)]"
      />
      {entry.start && (
        <p className="pt-small text-muted tabular-nums">
          <DateRange
            start={entry.start}
            end={entry.end}
            openEnded
            duration={entry.duration}
            fmt={entry.fmt}
          />
        </p>
      )}
      <h3 className={`mt-1 pt-h3 font-semibold ${wrap}`}>{entry.title}</h3>
      {entry.subtitle && <p className={`pt-body text-muted ${wrap}`}>{entry.subtitle}</p>}
      {entry.roles && (
        <RoleList
          roles={entry.roles}
          className="mt-4 space-y-4"
          titleClassName="pt-body font-semibold"
          datesClassName="pt-small text-muted tabular-nums"
          descriptionClassName="mt-1 text-muted"
        />
      )}
      {entry.description && (
        <ReadMore
          text={entry.description}
          locale={locale}
          lines={6}
          from={1500}
          className="mt-3 text-muted"
        />
      )}
    </li>
  );
}

export function Roles({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  const list = (items: Entry[]) => (
    <ol className="border-s border-line">
      {items.map((entry) => (
        <RoleRow key={entry.id} entry={entry} locale={block.locale} />
      ))}
    </ol>
  );
  return (
    <>
      {list(block.entries)}
      {block.rest.length > 0 && (
        <Collapse
          className="mt-8"
          label={fill(block.ui.density.earlierRoles, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
          buttonClassName={`${secondaryButton} !min-h-11 !py-2`}
        >
          <div className="mt-8">{list(block.rest)}</div>
        </Collapse>
      )}
    </>
  );
}

export function Studies({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  return (
    <ul className="space-y-8">
      {block.entries.map((entry) => (
        <li key={entry.id} className="min-w-0">
          <h3 className={`pt-body font-semibold ${wrap}`}>{entry.title}</h3>
          {entry.subtitle && <p className={`pt-body text-muted ${wrap}`}>{entry.subtitle}</p>}
          {entry.start && (
            <p className="mt-1 pt-small text-muted tabular-nums">
              <DateRange start={entry.start} end={entry.end} fmt={entry.fmt} />
            </p>
          )}
          {entry.description && (
            <p className={`mt-2 whitespace-pre-line text-muted ${wrap}`}>{entry.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SkillList({ block }: { block: Extract<Block, { kind: 'skills' }> }) {
  const list = (items: typeof block.skills) => (
    <ul className="flex flex-wrap gap-2">
      {items.map((skill) => (
        <li key={skill.id} className={chipClass}>
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
          className="mt-6"
          label={fill(block.ui.density.moreSkills, { count: block.rest.length })}
          closeLabel={block.ui.density.showLess}
          buttonClassName={`${secondaryButton} !min-h-11 !py-2`}
        >
          <div className="mt-5">{list(block.rest)}</div>
        </Collapse>
      )}
    </>
  );
}

// A custom section as an accordion (an FAQ, for one): each item is a details element, so it opens and
// closes with the keyboard and announces its state with no script at all.
export function Faq({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  return (
    <ul className="border-b border-line">
      {block.entries.map((entry) => {
        const hasBody = entry.subtitle || entry.description || entry.href || entry.start;
        const title = (
          <span className={`min-w-0 pt-body font-semibold ${wrap}`}>{entry.title}</span>
        );
        return (
          <li key={entry.id} className="border-t border-line">
            {hasBody ? (
              <details className="au-acc group">
                <summary
                  className={`flex min-h-14 cursor-pointer items-center justify-between gap-6 py-4 ${focusRing} focus-visible:-outline-offset-2`}
                >
                  {title}
                  <span aria-hidden="true" className="shrink-0 text-muted">
                    <Plus className="size-5 group-open:hidden" />
                    <Minus className="hidden size-5 group-open:block" />
                  </span>
                </summary>
                <div className="max-w-3xl pb-6">
                  {entry.subtitle && (
                    <p className={`pt-body font-semibold ${wrap}`}>{entry.subtitle}</p>
                  )}
                  {entry.start && (
                    <p className="mt-1 pt-small text-muted tabular-nums">
                      <DateRange start={entry.start} end={entry.end} fmt={entry.fmt} />
                    </p>
                  )}
                  {entry.description && (
                    <p className={`mt-2 whitespace-pre-line text-muted ${wrap}`}>
                      {entry.description}
                    </p>
                  )}
                  {entry.href && (
                    <p className="mt-3">
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
              <div className="flex min-h-14 items-center py-4">{title}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---- Writing: a clean list

function PostRow({ post, locale, badge }: { post: WritingEntry; locale: string; badge: string }) {
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
    <li className="group relative grid gap-1 border-t border-line py-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
      <p className="pt-small text-muted tabular-nums">
        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
        {post.external && <span className="ms-2 font-semibold">{badge}</span>}
      </p>
      <div className="min-w-0">
        <h3
          className={`pt-body font-semibold group-hover:underline group-hover:underline-offset-4 ${wrap}`}
        >
          {link}
        </h3>
        {post.excerpt && (
          <p className={`mt-1 line-clamp-2 pt-body text-muted ${wrap}`}>{post.excerpt}</p>
        )}
      </div>
    </li>
  );
}

export function Writing({ block }: { block: Extract<Block, { kind: 'writing' }> }) {
  return (
    <>
      <ul className="border-b border-line">
        {block.posts.map((post) => (
          <PostRow key={post.id} post={post} locale={block.locale} badge={block.ui.linkBadge} />
        ))}
      </ul>
      {block.more && (
        <p className="mt-8">
          <Link href={block.allHref} className={secondaryButton}>
            {block.ui.viewAll}
            <Arrow />
          </Link>
        </p>
      )}
    </>
  );
}

// ---- Contact

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
    <section aria-labelledby={id} className={`${gutter} py-14 sm:py-20`}>
      <div
        className={`${column} grid gap-10 ${form ? 'min-[1000px]:grid-cols-[1fr_1.1fr] min-[1000px]:gap-16' : ''}`}
      >
        <div className="min-w-0">
          <Heading
            id={id}
            tabIndex={-1}
            className={`${display} scroll-mt-24 pt-title outline-none ${wrap}`}
          >
            {heading}
          </Heading>
          {details.length > 0 && (
            <ul className="mt-8 space-y-3">
              {details.map((link) => {
                const Icon = LINK_ICONS[link.type];
                return (
                  <li key={link.id} className="min-w-0">
                    <a
                      href={link.href}
                      className={`inline-flex max-w-full items-center gap-3 pt-h3 font-semibold underline-offset-4 hover:underline ${wrap} ${focusRing}`}
                    >
                      <span aria-hidden="true" className="inline-flex shrink-0 text-accent-fg">
                        <Icon className="size-[0.85em]" />
                      </span>
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          {elsewhere.length > 0 && (
            <ul aria-label={ui.pages.links} className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {elsewhere.map((link) => (
                <li key={link.id} className="min-w-0">
                  <HeaderLink
                    link={link}
                    className={`inline-flex min-h-8 items-center gap-2 pt-small font-semibold text-muted underline underline-offset-4 hover:text-ink hover:no-underline ${wrap} ${focusRing}`}
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
            {header.contact && <ContactLink contact={header.contact} className={secondaryButton} />}
            <ShareButton {...header.share} ui={ui.share} variant="outline" />
          </div>
          {extras}
        </div>
        {form && (
          <div className="au-card au-edge min-w-0 self-start p-6 sm:p-8 print:hidden">{form}</div>
        )}
      </div>
    </section>
  );
}

export function FormOnCard({
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
      buttonClassName={`inline-flex min-h-12 items-center rounded-full bg-accent px-7 py-3 pt-small font-semibold text-on-accent hover:opacity-90 ${focusRing}`}
    />
  );
}

// A call to action card (the short Home page's pointer to Contact).
export function CtaCard({
  id,
  title,
  text,
  href,
  label,
}: {
  id: string;
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  return (
    <section aria-labelledby={id} className={`${gutter} py-14 sm:py-20`}>
      <div className={`${column} au-card au-edge p-8 sm:p-12`}>
        <h2 id={id} tabIndex={-1} className={`${h2Class} mb-3`}>
          {title}
        </h2>
        <p className={`max-w-xl pt-body text-muted text-pretty ${wrap}`}>{text}</p>
        <p className="mt-7">
          <Link href={href} className={primaryButton}>
            {label}
            <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

// ---- Footer: a rounded card with a faint glow along its lower edge

export function FooterCard({
  footer,
  header,
  links,
  nav,
}: {
  footer: FooterModel;
  header: HeaderModel;
  links: { href: string; label: string }[];
  nav: string;
}) {
  const socials = header.links.filter((link) => link.type !== 'email' && link.type !== 'phone');
  return (
    <footer className={`${gutter} pt-6 pb-10 print:pt-0`}>
      <div className={`${column} au-foot rounded-[1.75rem] p-7 sm:p-10`}>
        <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-8">
          <p className={`${display} pt-h2 ${wrap}`}>{footer.name}</p>
          {links.length > 0 && (
            <nav aria-label={nav}>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-small">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <a
                      href={link.href}
                      className={`inline-flex min-h-8 items-center text-muted hover:text-ink hover:underline hover:underline-offset-4 ${focusRing}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {socials.length > 0 && (
            <ul aria-label={header.ui.sidebar.social} className="flex flex-wrap gap-2">
              {socials.map((link) => {
                const Icon = LINK_ICONS[link.type];
                const content = (
                  <>
                    <span aria-hidden="true" className="inline-flex">
                      <Icon className="size-[1.1rem]" />
                    </span>
                    <span className="sr-only">{link.label}</span>
                  </>
                );
                const cls = `inline-flex size-10 items-center justify-center rounded-full border border-line hover:bg-surface ${focusRing}`;
                return (
                  <li key={link.id}>
                    {link.external ? (
                      <NewTabLink href={link.href} className={cls}>
                        {content}
                      </NewTabLink>
                    ) : (
                      <a href={link.href} className={cls}>
                        {content}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="mt-10 pt-small text-muted">
          © {footer.year} {footer.name} · Made {footer.message}{' '}
          <a
            href={footer.cta.href}
            className={`font-semibold text-ink underline underline-offset-4 hover:no-underline ${focusRing}`}
          >
            {footer.cta.label}
          </a>
        </p>
      </div>
    </footer>
  );
}
