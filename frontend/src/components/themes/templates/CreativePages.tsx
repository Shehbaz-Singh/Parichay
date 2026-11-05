import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '@/components/ShareButton';
import { formatMonthYear } from '@/lib/format';
import { fill, translatorFor } from '@/lib/i18n';
import type { Block, HeaderModel, ProjectEntry } from '../blocks';
import { ContactForm } from '../ContactForm';
import {
  Avatar,
  AvailabilityBadge,
  ContactLink,
  HeaderLink,
  NewTabLink,
  ResumeLink,
  MoreLinkView,
} from '../parts';
import { ThemeWrapper } from '../ThemeWrapper';
import { WorkCard } from '../WorkCard';
import {
  Breadcrumbs,
  type AboutPageModel,
  type ContactPageModel,
  type CustomPageModel,
  type HomeModel,
  type PageView,
  type ProjectPageModel,
  type WorkPageModel,
} from './model';
import { focusRing } from '@/components/themes/tokens';

// The page templates of the Creative theme: loud, heavy type under a header in the accent color, thick
// ink borders, hard offset shadows, big outlined numbers and stickers. Each page has a layout of its own
// (Home, Work, a project, About, Contact, a page the owner made). The theme file hands over what only it
// has (the fonts, the Home hero, the block renderer, the footer), so this file never imports it.

export interface CreativePagesProps {
  profile: PublicProfile;
  view: PageView;
  nav?: ReactNode;
  idPrefix: string;
  fontClass: string;
  hero: ReactNode; // the theme's own Header: the Home introduction
  footer: ReactNode;
  renderBlock: (block: Block) => ReactNode; // the theme's own body of a block (jobs, education, ...)
}

const monoText = 'font-(family-name:--font-theme-mono)';
const outline =
  'font-black text-transparent [-webkit-text-stroke:2px_var(--text)] leading-none select-none';

const shadow =
  'border-2 border-ink bg-page shadow-[6px_6px_0_0_var(--accent)] transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[9px_9px_0_0_var(--accent)] motion-safe:hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--accent)]';
const sticker =
  'inline-flex max-w-full items-center rounded-full border-2 border-ink bg-page px-3.5 py-1 text-sm font-bold [overflow-wrap:anywhere]';
const button = `inline-flex max-w-full items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-2.5 text-base font-black text-page transition motion-safe:hover:-translate-y-0.5 ${focusRing}`;
const ghost = `inline-flex max-w-full items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 text-base font-bold transition hover:bg-ink hover:text-page motion-safe:hover:-translate-y-0.5 ${focusRing}`;
const arrow = 'size-5 shrink-0 rtl:-scale-x-100';
const wrapText = '[overflow-wrap:anywhere]';

const pad = (n: number) => String(n).padStart(2, '0');

// ---- pieces

// The loud title of a page: the owner's name as a small tag, then the title in giant type.
function Title({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <header className="border-b-4 border-ink pt-10 pb-8 sm:pt-14 sm:pb-12">
      {kicker && (
        <p className="mb-4 inline-block rounded-md bg-accent-soft px-2.5 py-0.5 text-sm font-black text-accent-fg">
          {kicker}
        </p>
      )}
      <h1
        className={`text-[clamp(2.75rem,12vw,8.5rem)] leading-[0.9] font-black tracking-tighter text-balance ${wrapText}`}
      >
        {children}
      </h1>
    </header>
  );
}

function Heading({ id, number, children }: { id: string; number?: number; children: ReactNode }) {
  return (
    <div className="min-w-0">
      {number !== undefined && (
        <span aria-hidden="true" className={`pt-display block leading-none opacity-40 ${outline}`}>
          {pad(number)}
        </span>
      )}
      <h2 id={id} className="pt-h2 mt-2 font-extrabold [overflow-wrap:break-word]">
        {children}
      </h2>
    </div>
  );
}

// A section: the heading (and its number) beside the content on a wide screen, above it on a phone.
function Band({
  id,
  title,
  number,
  children,
}: {
  id: string;
  title: string;
  number?: number;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-6 border-t-4 border-ink py-12 first:border-t-0 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10"
    >
      <div className="min-w-0 md:sticky md:top-[calc(2rem+var(--nav-h,0px))] md:self-start">
        <Heading id={id} number={number}>
          {title}
        </Heading>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

// The sections that have no template of their own (jobs, education, skills, custom sections), through the
// theme's own renderer.
function Blocks({
  blocks,
  render,
}: {
  blocks: Block[];
  render: CreativePagesProps['renderBlock'];
}) {
  return (
    <>
      {blocks.map((block) => (
        <Band key={block.id} id={block.id} title={block.title}>
          {render(block)}
        </Band>
      ))}
    </>
  );
}

type Cover = ProjectEntry['cover'];

// A cover with its size, so the space is kept. `first` is the one above the fold.
function CoverImage({
  cover,
  className,
  first = false,
  fallbackAlt = '',
}: {
  cover: NonNullable<Cover>;
  className: string;
  first?: boolean;
  fallbackAlt?: string;
}) {
  return (
    // A plain <img>: Cloudinary serves the cover already cropped; the width and height keep its space.
    <img
      src={cover.src}
      alt={cover.alt || fallbackAlt}
      width={cover.width}
      height={cover.height}
      loading={first ? 'eager' : 'lazy'}
      fetchPriority={first ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  );
}

// A project as a poster card: its cover, its title as the link to its page, the technologies as stickers.
function ProjectPoster({
  project,
  visit,
  index,
  big = false,
  first = false,
}: {
  project: ProjectEntry;
  visit: string;
  index: number;
  big?: boolean;
  first?: boolean;
}) {
  return (
    <li
      className={`group relative flex min-w-0 flex-col rounded-2xl p-5 sm:p-6 ${shadow} ${big ? 'lg:col-span-2' : ''}`}
    >
      {project.cover ? (
        <CoverImage
          cover={project.cover}
          first={first}
          className={`mb-5 w-full rounded-lg border-2 border-ink object-cover ${big ? 'aspect-[21/9]' : 'aspect-[40/21]'}`}
        />
      ) : (
        <span aria-hidden="true" className={`mb-3 block text-6xl ${outline}`}>
          {pad(index + 1)}
        </span>
      )}
      <h3
        className={`leading-[0.98] font-black tracking-tight text-balance ${wrapText} ${big ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl'}`}
      >
        <Link
          href={project.detailHref}
          className={`after:absolute after:inset-0 after:rounded-2xl ${focusRing}`}
        >
          {project.name}
        </Link>
      </h3>
      {project.description && (
        <p className={`mt-3 line-clamp-3 text-lg font-medium text-muted ${wrapText}`}>
          {project.description}
        </p>
      )}
      {project.tags.length > 0 && (
        <ul className={`${monoText} mt-4 flex flex-wrap gap-1.5`}>
          {project.tags.slice(0, 6).map((tag) => (
            <li
              key={tag}
              className={`rounded-md bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-fg ${wrapText}`}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
      {project.href && (
        <p className="relative z-10 mt-4">
          <NewTabLink
            href={project.href}
            context={project.name}
            className={`inline-flex items-center gap-1 text-sm font-black underline underline-offset-4 hover:no-underline ${focusRing}`}
          >
            {visit}
            <ArrowUpRight aria-hidden="true" className={arrow} />
          </NewTabLink>
        </p>
      )}
    </li>
  );
}

// The ways to reach the owner, as buttons: their links, the contact card and the resume.
function LinkButtons({ header, className }: { header: HeaderModel; className: string }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {header.links.map((link) => (
        <li key={link.id} className="max-w-full">
          <HeaderLink link={link} className={className} />
        </li>
      ))}
      {header.contact && (
        <li className="print:hidden">
          <ContactLink contact={header.contact} className={className} />
        </li>
      )}
      {header.resume && (
        <li>
          <ResumeLink resume={header.resume} className={className} />
        </li>
      )}
    </ul>
  );
}

const badge = (header: HeaderModel) => (
  <AvailabilityBadge
    availability={header.availability}
    ui={header.ui}
    className="w-fit rounded-2xl border-2 border-ink bg-accent-soft px-4 py-2.5 text-sm font-bold text-ink"
    dotClassName="bg-accent"
    linkClassName={`underline underline-offset-2 hover:no-underline ${focusRing}`}
  />
);

// ---- Home

function Home({ model, render }: { model: HomeModel; render: CreativePagesProps['renderBlock'] }) {
  const { header } = model;
  const ui = header.ui;
  const t = ui.pages;
  const locale = header.locale;
  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        {model.now && (
          <p
            className={`${monoText} -mt-2 mb-8 inline-flex max-w-full items-center gap-2 rounded-full border-2 border-ink bg-accent-soft px-3 py-1 text-xs font-bold ${wrapText}`}
          >
            <span className="shrink-0 rounded-full bg-ink px-2 text-[0.7rem] font-black text-page uppercase">
              {t.now}
            </span>
            <span>
              {fill(t.atCompany, { role: model.now.role, company: model.now.company })}
              {model.now.open && (
                <>
                  {' · '}
                  {fill(t.since, { date: formatMonthYear(model.now.since, locale) })}
                </>
              )}
            </span>
          </p>
        )}

        {model.featured.length > 0 && (
          <Band id="home-work" title={ui.sections.projects} number={model.projectTotal}>
            <ul className="grid gap-6 lg:grid-cols-2">
              {model.featured.map((project, index) => (
                <ProjectPoster
                  key={project.id}
                  project={project}
                  visit={ui.viewProject}
                  index={index}
                  big={index === 0 && model.featured.length > 2}
                />
              ))}
            </ul>
            {model.work && (
              <p className="mt-8">
                <Link href={model.work.href} className={button}>
                  {t.allWork}
                  <ArrowRight aria-hidden="true" className={arrow} />
                </Link>
              </p>
            )}
          </Band>
        )}

        {model.about && (
          <Band id="home-about" title={model.aboutTitle}>
            <p className="text-[clamp(1.5rem,4.2vw,2.75rem)] leading-[1.1] font-black tracking-tight text-pretty whitespace-pre-line">
              {model.about.text}
            </p>
            {model.about.href && (
              <p className="mt-6">
                <Link href={model.about.href} className={ghost}>
                  {model.about.label}
                  <ArrowRight aria-hidden="true" className={arrow} />
                </Link>
              </p>
            )}
          </Band>
        )}

        {model.skills.length > 0 && (
          <Band id="home-skills" title={ui.sections.skills}>
            <ul className="flex flex-wrap gap-2.5">
              {model.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border-2 border-ink px-4 py-1.5 font-bold [overflow-wrap:anywhere]"
                >
                  {skill}
                </li>
              ))}
              {model.skillsTotal > model.skills.length && (
                <li className="rounded-full border-2 border-dashed border-ink px-4 py-1.5 font-bold">
                  {fill(t.skillsMore, { count: model.skillsTotal - model.skills.length })}
                </li>
              )}
            </ul>
          </Band>
        )}

        {model.more && <MoreLinkView more={model.more} className="mt-8" />}
        {model.testimonial && (
          <Band id="home-kind" title={t.kindWords}>
            <figure className={`rounded-2xl p-6 sm:p-8 ${shadow}`}>
              <blockquote
                className={`text-xl leading-snug font-bold whitespace-pre-line sm:text-2xl ${wrapText}`}
              >
                {model.testimonial.message}
              </blockquote>
              <figcaption className="mt-4 text-sm font-bold">
                {model.testimonial.name}
                {model.testimonial.detail && (
                  <span className="font-medium text-muted"> · {model.testimonial.detail}</span>
                )}
              </figcaption>
            </figure>
          </Band>
        )}

        {model.writing && (
          <Band id={model.writing.id} title={model.writing.title}>
            {render(model.writing)}
          </Band>
        )}

        {/* The call to action: a giant block, to the Contact page or the form itself. */}
        <section
          aria-labelledby="home-cta"
          className="mt-12 rounded-3xl border-2 border-ink bg-ink px-6 py-10 text-page shadow-[8px_8px_0_0_var(--accent)] sm:px-10 sm:py-14 print:hidden"
        >
          <h2
            id="home-cta"
            className={`text-[clamp(2.25rem,8vw,5.5rem)] leading-[0.92] font-black tracking-tighter text-balance ${wrapText}`}
          >
            {model.cta?.title ?? model.contact?.title ?? t.contactHeadline}
          </h2>
          {model.cta ? (
            <>
              <p className="mt-4 max-w-xl text-xl font-medium">{model.cta.text}</p>
              <p className="mt-7">
                <Link
                  href={model.cta.href}
                  className={`inline-flex items-center gap-2 rounded-full border-2 border-page bg-page px-6 py-3 text-lg font-black text-ink transition motion-safe:hover:-translate-y-0.5 ${focusRing} focus-visible:outline-page`}
                >
                  {model.cta.label}
                  <ArrowRight aria-hidden="true" className={arrow} />
                </Link>
              </p>
            </>
          ) : model.contact ? (
            <div className="mt-6 max-w-xl text-ink">
              <div className="rounded-2xl bg-page p-5">{render(model.contact)}</div>
            </div>
          ) : (
            <div className="mt-7">
              <LinkButtons
                header={header}
                className={`inline-flex max-w-full items-center gap-2 rounded-full border-2 border-page px-5 py-2.5 text-base font-bold transition hover:bg-page hover:text-ink ${focusRing} focus-visible:outline-page`}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ---- Work

function Work({
  model,
  visit,
  render,
}: {
  model: WorkPageModel;
  visit: string;
  render: CreativePagesProps['renderBlock'];
}) {
  const t = model.header.ui.pages;
  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <Title kicker={model.header.name}>{model.title}</Title>
      <Blocks blocks={model.before} render={render} />
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 py-8">
        <p className="max-w-xl text-xl font-bold text-balance sm:text-2xl">
          {model.intro ?? t.workIntro}
        </p>
        <p className="flex items-baseline gap-3">
          <span aria-hidden="true" className={`text-7xl ${outline}`}>
            {pad(model.projects.length)}
          </span>
          <span className="sr-only">
            {translatorFor(model.header.locale)('pages.projectCount', {
              count: model.projects.length,
            })}
          </span>
        </p>
      </div>
      {model.tags.length > 0 && (
        <section aria-label={t.tagsLabel} className="border-y-4 border-ink py-5">
          <ul className={`${monoText} flex flex-wrap gap-2`}>
            {model.tags.map((tag) => (
              <li key={tag.name} className={sticker}>
                {tag.name}
                {tag.count > 1 && (
                  <span className="ms-2 rounded-full bg-ink px-1.5 text-xs text-page">
                    {tag.count}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label={model.title} className="py-10">
        <ul className="grid gap-6 lg:grid-cols-2">
          {model.projects.map((project, index) => (
            <ProjectPoster
              key={project.id}
              project={project}
              visit={visit}
              index={index}
              big={index === 0 && model.projects.length >= 3}
              first={index === 0}
            />
          ))}
        </ul>
      </section>
      <Blocks blocks={model.blocks} render={render} />
    </div>
  );
}

// ---- a project

function Project({ model }: { model: ProjectPageModel }) {
  const ui = model.header.ui;
  const t = ui.pages;
  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <article>
        <div className="pt-8">
          <Breadcrumbs crumbs={model.crumbs} label={t.breadcrumbs} />
        </div>
        <header className="border-b-4 border-ink pb-8 sm:pb-12">
          <p className={`${monoText} mb-4 flex flex-wrap items-center gap-3 text-sm font-bold`}>
            <span className="rounded-md bg-accent-soft px-2.5 py-0.5 font-black text-accent-fg">
              {t.caseStudy}
            </span>
            <span aria-hidden="true" className={`text-4xl ${outline}`}>
              {pad(model.position)}
            </span>
            <span>{fill(t.projectOf, { n: model.position, total: model.total })}</span>
          </p>
          <h1
            className={`text-[clamp(2.5rem,11vw,7.5rem)] leading-[0.9] font-black tracking-tighter text-balance ${wrapText}`}
          >
            {model.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
            {model.external && (
              <NewTabLink href={model.external} context={model.name} className={button}>
                {t.visit}
                <ArrowUpRight aria-hidden="true" className={arrow} />
              </NewTabLink>
            )}
            <ShareButton {...model.share} variant="outline" ui={ui.share} newTab={ui.newTab} />
          </div>
        </header>

        {model.cover && (
          <CoverImage
            cover={model.cover}
            first
            fallbackAlt={model.name}
            className="mt-10 h-auto w-full rounded-2xl border-4 border-ink shadow-[10px_10px_0_0_var(--accent)] print:break-inside-avoid"
          />
        )}

        <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,1fr)_16rem]">
          {model.description && (
            <p
              className={`text-2xl leading-snug font-bold whitespace-pre-line sm:text-3xl ${wrapText}`}
            >
              {model.description}
            </p>
          )}
          {model.tags.length > 0 && (
            <section aria-label={t.technologies} className="min-w-0 md:order-last">
              <h2 className="mb-3 text-sm font-black tracking-wide uppercase">{t.technologies}</h2>
              <ul className={`${monoText} flex flex-wrap gap-2`}>
                {model.tags.map((tag) => (
                  <li key={tag} className={sticker}>
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {model.gallery.length > 0 && (
          <section aria-label={t.gallery} className="mt-14">
            <ul className="grid gap-6 sm:grid-cols-2">
              {model.gallery.map((image, index) => (
                <li
                  key={image.id}
                  className={`min-w-0 print:break-inside-avoid ${index % 3 === 0 ? 'sm:col-span-2' : ''}`}
                >
                  {/* Below the fold: lazy, with its size so nothing shifts. */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full rounded-xl border-2 border-ink shadow-[6px_6px_0_0_var(--accent)]"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {(model.previous || model.next) && (
          <nav
            aria-label={t.otherProjects}
            className="mt-16 grid gap-6 border-t-4 border-ink pt-10 sm:grid-cols-2 print:hidden"
          >
            {model.previous ? (
              <Link
                href={model.previous.href}
                rel="prev"
                className={`group flex min-w-0 flex-col rounded-2xl p-5 ${shadow} ${focusRing}`}
              >
                <span className="flex items-center gap-2 text-sm font-black uppercase">
                  <ArrowLeft aria-hidden="true" className={arrow} />
                  {t.previous}
                </span>
                <span className={`mt-2 text-2xl leading-tight font-black ${wrapText}`}>
                  {model.previous.name}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {model.next && (
              <Link
                href={model.next.href}
                rel="next"
                className={`group flex min-w-0 flex-col rounded-2xl bg-accent-soft p-5 text-end sm:col-start-2 ${shadow} ${focusRing}`}
              >
                <span className="flex items-center justify-end gap-2 text-sm font-black uppercase">
                  {t.next}
                  <ArrowRight aria-hidden="true" className={arrow} />
                </span>
                <span className={`mt-2 text-2xl leading-tight font-black ${wrapText}`}>
                  {model.next.name}
                </span>
              </Link>
            )}
          </nav>
        )}

        <p className="mt-10 print:hidden">
          <Link href={model.back.href} className={ghost}>
            <ArrowLeft aria-hidden="true" className={arrow} />
            {fill(t.backTo, { page: model.back.label })}
          </Link>
        </p>
      </article>
    </div>
  );
}

// ---- About

function About({
  model,
  render,
}: {
  model: AboutPageModel;
  render: CreativePagesProps['renderBlock'];
}) {
  const { header } = model;
  const t = header.ui.pages;
  const paragraphs = (model.text ?? '').split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <Title kicker={header.name}>{model.title}</Title>
      <section
        aria-label={t.aboutHeadline}
        className="grid gap-10 border-b-4 border-ink py-12 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-14"
      >
        <div className="min-w-0">
          <Avatar
            avatar={header.avatar}
            className="size-44 rounded-[2rem] border-4 border-ink shadow-[8px_8px_0_0_var(--accent)] sm:size-56"
            placeholderClassName="bg-accent text-6xl font-black text-on-accent"
          />
          <p className="mt-6 text-2xl leading-tight font-black">{header.name}</p>
          {header.tagline && (
            <p className="mt-1 text-lg font-bold text-muted text-pretty">{header.tagline}</p>
          )}
          {header.location && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              {header.location}
            </p>
          )}
        </div>
        <div className="min-w-0">
          {paragraphs.length > 0 && (
            <div className="space-y-5 text-xl leading-snug font-bold sm:text-2xl [&>p:first-child]:text-[clamp(1.75rem,4.6vw,3rem)] [&>p:first-child]:leading-[1.08] [&>p:first-child]:tracking-tight">
              {paragraphs.map((text, index) => (
                <p key={index} className={wrapText}>
                  {text}
                </p>
              ))}
            </div>
          )}
          {model.facts.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-3">
              {model.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="min-w-0 rounded-2xl border-2 border-ink bg-accent-soft px-4 py-2.5"
                >
                  <dt className="text-xs font-black tracking-wide uppercase">{fact.label}</dt>
                  <dd className={`font-bold ${wrapText}`}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-8">
            <LinkButtons header={header} className={ghost} />
          </div>
          {header.availability && <div className="mt-6">{badge(header)}</div>}
        </div>
      </section>
      <Blocks blocks={model.blocks} render={render} />
    </div>
  );
}

// ---- Contact

function Contact({ model }: { model: ContactPageModel }) {
  const { header } = model;
  const t = header.ui.pages;
  const link =
    'flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-ink bg-page px-5 py-4 text-2xl font-black shadow-[6px_6px_0_0_var(--accent)] transition-all hover:bg-accent-soft motion-safe:hover:-translate-y-0.5 sm:text-3xl [&>span]:min-w-0 [&_svg]:size-7';
  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <Title kicker={header.name}>{model.title}</Title>
      <div className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="min-w-0">
          <p className="text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.05] font-black tracking-tight text-balance">
            {t.contactHeadline}
          </p>
          <p className="mt-3 text-xl font-bold text-muted">{t.contactIntro}</p>
          {header.availability && <div className="mt-6">{badge(header)}</div>}
          {header.links.length > 0 && (
            <section aria-label={t.reach} className="mt-8">
              <ul className="space-y-4">
                {header.links.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <HeaderLink link={item} className={`${link} ${focusRing}`} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(header.contact || header.resume) && (
            <div className="mt-6">
              <ul className="flex flex-wrap gap-3">
                {header.contact && (
                  <li className="print:hidden">
                    <ContactLink contact={header.contact} className={ghost} />
                  </li>
                )}
                {header.resume && (
                  <li>
                    <ResumeLink resume={header.resume} className={ghost} />
                  </li>
                )}
              </ul>
            </div>
          )}
          {model.work && (
            <WorkCard
              work={model.work}
              className="mt-8 w-full max-w-md rounded-2xl border-2 border-ink bg-accent-soft px-4 py-3 text-sm font-bold"
              linkClassName={`underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`rounded-full border-2 border-ink px-3 py-1 text-xs font-bold hover:bg-ink hover:text-page ${focusRing}`}
            />
          )}
        </div>
        {model.form && (
          <section
            aria-label={model.title}
            className="min-w-0 self-start rounded-3xl border-2 border-ink bg-page p-6 shadow-[8px_8px_0_0_var(--accent)] print:hidden"
          >
            <ContactForm
              form={model.form}
              page={model.state ?? undefined}
              buttonClassName={button}
            />
          </section>
        )}
      </div>
    </div>
  );
}

// ---- a page the owner made

function Custom({
  model,
  render,
}: {
  model: CustomPageModel;
  render: CreativePagesProps['renderBlock'];
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <Title kicker={model.header.name}>{model.title}</Title>
      {model.body && (
        <div
          className={`max-w-3xl py-10 text-xl leading-snug font-medium sm:text-2xl ${wrapText} [&_a]:font-black [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-black [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-black [&_li]:mt-1 [&_p]:mt-5 [&_ul]:list-disc [&_ul]:ps-6 [&>*:first-child]:mt-0`}
        >
          <Markdown>{model.body}</Markdown>
        </div>
      )}
      <Blocks blocks={model.blocks} render={render} />
    </div>
  );
}

// ---- the page

export function CreativePages({
  profile,
  view,
  nav,
  idPrefix,
  fontClass,
  hero,
  footer,
  renderBlock,
}: CreativePagesProps) {
  const visit = view.header.ui.viewProject;
  let page: ReactNode;
  switch (view.kind) {
    case 'home':
      page = <Home model={view} render={renderBlock} />;
      break;
    case 'work':
      page = <Work model={view} visit={visit} render={renderBlock} />;
      break;
    case 'project':
      page = <Project model={view} />;
      break;
    case 'about':
      page = <About model={view} render={renderBlock} />;
      break;
    case 'contact':
      page = <Contact model={view} />;
      break;
    case 'custom':
      page = <Custom model={view} render={renderBlock} />;
      break;
  }
  return (
    <ThemeWrapper theme="creative" profile={profile} nav={nav} className={fontClass}>
      {view.kind === 'home' && hero}
      <main id={`${idPrefix}main`}>{page}</main>
      {footer}
    </ThemeWrapper>
  );
}
