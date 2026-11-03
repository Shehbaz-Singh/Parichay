import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '@/components/ShareButton';
import { formatMonthYear } from '@/lib/format';
import { fill, uiFor, type Ui } from '@/lib/i18n';
import type { Block, ProjectEntry } from '../blocks';
import { ContactForm } from '../ContactForm';
import { AvailabilityBadge, HeaderLink, NewTabLink, ResumeLink } from '../parts';
import { ThemeWrapper } from '../ThemeWrapper';
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

// The Executive theme's pages in multi mode: a resume sheet. The sidebar (identity, contact, skills) stays
// on every page, as on a resume; the main column changes its form with the page. Home is a summary
// sheet, Work a ledger of projects, a project a data sheet with a facts table, About the body of the
// resume, Contact a ruled contact sheet. Dense type, rules instead of boxes, no motion, and it prints:
// interactive chrome is print:hidden. What the theme file owns (the sidebar, the section frame, the block
// renderer, the footer) comes in as props, so this file never imports the theme (no cycle).

const display = 'font-(family-name:--font-theme-display)';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const link = `text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`;
const small = 'text-xs font-bold tracking-[0.14em] uppercase';
const wrap = '[overflow-wrap:anywhere]';

export interface ExecutivePagesProps {
  profile: PublicProfile;
  view: PageView;
  nav?: ReactNode;
  idPrefix: string;
  fontClass: string;
  sidebar: ReactNode; // the theme's sidebar, which draws the owner's name as a paragraph here
  footer: ReactNode;
  renderBlock: (block: Block) => ReactNode;
  Section: ComponentType<{ block: Block; children: ReactNode }>;
}

// The title of a page: the owner's name above, the page's name large, a heavy rule under it.
function Band({ kicker, title, lede }: { kicker?: string; title: string; lede?: string | null }) {
  return (
    <header className="mb-8 border-b-2 border-ink pb-4 print:mb-4">
      {kicker && <p className={`${small} mb-1.5 text-muted`}>{kicker}</p>}
      <h1
        className={`${display} text-3xl leading-tight font-semibold tracking-tight text-balance ${wrap} sm:text-4xl`}
      >
        {title}
      </h1>
      {lede && (
        <p className={`${display} mt-2 max-w-[60ch] text-lg leading-snug text-pretty text-muted`}>
          {lede}
        </p>
      )}
    </header>
  );
}

// A titled part of a page, ruled like the sections of the resume.
function Part({
  id,
  title,
  children,
  className = '',
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`mt-9 first:mt-0 print:break-inside-avoid ${className}`}
    >
      <h2
        id={id}
        className={`${display} relative mb-4 break-after-avoid border-b border-line pb-2 text-xl font-semibold`}
      >
        {title}
        <span aria-hidden="true" className="absolute -bottom-px start-0 h-0.5 w-12 bg-accent" />
      </h2>
      {children}
    </section>
  );
}

// The tags of a project as a plain middle-dot list, in the manner of a resume's "Technologies" line.
const tagLine = (tags: string[]) => tags.join(' · ');

// A cover, with its size, above the fold (eager and high priority) or below it (lazy).
function Cover({
  cover,
  className,
  priority = false,
}: {
  cover: NonNullable<ProjectEntry['cover']>;
  className: string;
  priority?: boolean;
}) {
  return (
    <img
      src={cover.src}
      alt={cover.alt}
      width={cover.width}
      height={cover.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  );
}

// ---- Home: the summary sheet

function Home({ model, profile, id, ui, renderBlock, Section }: SubProps<HomeModel>) {
  const { header } = model;
  return (
    <>
      <header className="mb-8 border-b-2 border-ink pb-5 print:mb-4">
        <h1
          className={`${display} text-4xl leading-tight font-semibold tracking-tight text-balance ${wrap} sm:text-5xl`}
        >
          {header.name}
        </h1>
        {header.tagline && (
          <p className={`${display} mt-2 max-w-[56ch] text-xl leading-snug text-pretty text-muted`}>
            {header.tagline}
          </p>
        )}
        {model.now && (
          <p className={`mt-3 text-sm ${wrap}`}>
            <span className={`${small} me-2 text-muted`}>{ui.pages.now}</span>
            <span className="font-semibold">{model.now.company}</span>
            {model.now.role && <span>, {model.now.role}</span>}
            <span className="text-muted">
              {' '}
              · {fill(ui.pages.since, { date: formatMonthYear(model.now.since, profile.locale) })}
            </span>
          </p>
        )}
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-x-12 print:block">
        <div className="min-w-0">
          {model.about && (
            <Part id={`${id}profile`} title={model.aboutTitle}>
              <p className={`max-w-[68ch] leading-relaxed whitespace-pre-line ${wrap}`}>
                {model.about.text}
              </p>
              {model.about.href && (
                <p className="mt-3 print:hidden">
                  <Link
                    href={model.about.href}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${link}`}
                  >
                    {model.about.label}
                    <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
                  </Link>
                </p>
              )}
            </Part>
          )}

          {model.featured.length > 0 && (
            <Part id={`${id}projects`} title={ui.sections.projects}>
              <ol className="divide-y divide-line border-y border-line">
                {model.featured.map((project) => (
                  <li
                    key={project.id}
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-4 break-inside-avoid"
                  >
                    {project.cover && (
                      <Cover
                        cover={project.cover}
                        className="h-auto w-24 border border-line sm:w-32 print:hidden"
                      />
                    )}
                    <div className={`min-w-0 ${project.cover ? '' : 'col-span-2'}`}>
                      <h3 className="font-bold">
                        <Link href={project.detailHref} className={link}>
                          {project.name}
                        </Link>
                      </h3>
                      {project.description && (
                        <p className={`mt-1 line-clamp-2 text-sm leading-relaxed ${wrap}`}>
                          {project.description}
                        </p>
                      )}
                      {project.tags.length > 0 && (
                        <p className={`mt-1 text-sm text-muted ${wrap}`}>{tagLine(project.tags)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {model.work && (
                <p className="mt-3 print:hidden">
                  <Link
                    href={model.work.href}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${link}`}
                  >
                    {ui.pages.allWork} ({model.projectTotal})
                    <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
                  </Link>
                </p>
              )}
            </Part>
          )}

          {model.writing && <Section block={model.writing}>{renderBlock(model.writing)}</Section>}
        </div>

        <div className="min-w-0 lg:border-s lg:border-line lg:ps-8 print:border-0 print:ps-0">
          {model.testimonial && (
            <Part id={`${id}kind`} title={ui.pages.kindWords}>
              <figure>
                <blockquote
                  className={`${display} border-s-4 border-accent ps-4 leading-relaxed italic ${wrap}`}
                >
                  {model.testimonial.message.length > 260
                    ? `${model.testimonial.message.slice(0, 260).trimEnd()}…`
                    : model.testimonial.message}
                </blockquote>
                <figcaption className="mt-2 ps-5 text-sm">
                  <span className="font-semibold">{model.testimonial.name}</span>
                  {model.testimonial.detail && (
                    <span className="text-muted">, {model.testimonial.detail}</span>
                  )}
                </figcaption>
              </figure>
            </Part>
          )}
        </div>
      </div>

      {model.cta && (
        <section
          aria-labelledby={`${id}cta`}
          className="mt-10 border-y-2 border-ink py-5 sm:flex sm:items-center sm:justify-between sm:gap-6 print:hidden"
        >
          <div className="min-w-0">
            <h2 id={`${id}cta`} className={`${display} text-xl font-semibold`}>
              {model.cta.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{model.cta.text}</p>
          </div>
          <Link
            href={model.cta.href}
            className={`mt-4 inline-flex shrink-0 items-center gap-2 rounded border border-ink px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-page sm:mt-0 ${focusRing}`}
          >
            {model.cta.label}
            <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </Link>
        </section>
      )}
      {model.contact && (
        <div className="mt-10">
          <Section block={model.contact}>{renderBlock(model.contact)}</Section>
        </div>
      )}
    </>
  );
}

// ---- Work: a ledger of projects

function Work({ model, id, ui, renderBlock, Section }: SubProps<WorkPageModel>) {
  const [first, ...rest] = model.projects;
  return (
    <>
      <Band kicker={model.header.name} title={model.title} lede={model.intro} />
      {model.before
        .filter((block) => block.kind !== 'skills')
        .map((block) => (
          <div key={block.id} className="mb-10">
            <Section block={block}>{renderBlock(block)}</Section>
          </div>
        ))}
      <p className="-mt-4 mb-8 text-sm text-muted">
        {fill(ui.pages.projectCount, { count: model.projects.length })}
      </p>

      {model.tags.length > 0 && (
        <section aria-labelledby={`${id}tags`} className="mb-9">
          <h2 id={`${id}tags`} className={`${small} mb-2 text-muted`}>
            {ui.pages.tagsLabel}
          </h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {model.tags.map((tag) => (
              <li key={tag.name} className={wrap}>
                {tag.name}
                {tag.count > 1 && <span className="text-muted"> ×{tag.count}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {first && (
        <article
          aria-labelledby={`${id}p-${first.id}`}
          className="border-y-2 border-ink py-6 print:break-inside-avoid"
        >
          {first.cover && (
            <Cover
              cover={first.cover}
              priority
              className="mb-5 h-auto w-full max-w-3xl border border-line"
            />
          )}
          <h2 id={`${id}p-${first.id}`} className={`${display} text-2xl font-semibold ${wrap}`}>
            <Link href={first.detailHref} className={link}>
              {first.name}
            </Link>
          </h2>
          {first.description && (
            <p className={`mt-2 max-w-[68ch] leading-relaxed whitespace-pre-line ${wrap}`}>
              {first.description}
            </p>
          )}
          {first.tags.length > 0 && (
            <p className={`mt-2 text-sm text-muted ${wrap}`}>{tagLine(first.tags)}</p>
          )}
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm print:hidden">
            <Link href={first.detailHref} className={`font-semibold ${link}`}>
              {ui.pages.viewProject}
            </Link>
            {first.href && (
              <NewTabLink href={first.href} context={first.name} className={link}>
                {ui.pages.visit}
              </NewTabLink>
            )}
          </p>
        </article>
      )}

      {rest.length > 0 && (
        <ol className="divide-y divide-line border-b border-line">
          {rest.map((project, index) => (
            <li key={project.id} className="min-w-0 py-5 break-inside-avoid">
              <article
                aria-labelledby={`${id}p-${project.id}`}
                className="grid gap-x-6 gap-y-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]"
              >
                <span
                  aria-hidden="true"
                  className={`${display} hidden text-lg text-muted tabular-nums sm:block`}
                >
                  {String(index + 2).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h2 id={`${id}p-${project.id}`} className={`font-bold ${wrap}`}>
                    <Link href={project.detailHref} className={link}>
                      {project.name}
                    </Link>
                  </h2>
                  {project.description && (
                    <p className={`mt-1 line-clamp-3 text-sm leading-relaxed ${wrap}`}>
                      {project.description}
                    </p>
                  )}
                  {project.tags.length > 0 && (
                    <p className={`mt-1 text-sm text-muted ${wrap}`}>{tagLine(project.tags)}</p>
                  )}
                </div>
                {project.cover && (
                  <Cover
                    cover={project.cover}
                    className="h-auto w-28 border border-line max-sm:hidden print:hidden"
                  />
                )}
              </article>
            </li>
          ))}
        </ol>
      )}

      {/* The jobs, and what else the owner put on this page: experience is the heart of a resume. The
          skills are in the sidebar. */}
      {model.blocks
        .filter((block) => block.kind !== 'skills')
        .map((block) => (
          <div key={block.id} className="mt-10">
            <Section block={block}>{renderBlock(block)}</Section>
          </div>
        ))}
    </>
  );
}

// ---- a project: a data sheet

function Project({ model, id, ui }: SubProps<ProjectPageModel>) {
  const facts: { term: string; value: ReactNode }[] = [
    {
      term: ui.pages.caseStudy,
      value: fill(ui.pages.projectOf, { n: model.position, total: model.total }),
    },
  ];
  if (model.tags.length > 0) {
    facts.push({ term: ui.pages.technologies, value: tagLine(model.tags) });
  }
  const rows = facts;
  if (model.external) {
    rows.push({
      term: ui.pages.links,
      value: (
        <NewTabLink href={model.external} context={model.name} className={link}>
          {ui.pages.visit}
        </NewTabLink>
      ),
    });
  }
  return (
    <article>
      <Breadcrumbs crumbs={model.crumbs} label={ui.pages.breadcrumbs} />
      <header className="mb-6 border-b-2 border-ink pb-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <h1
            className={`${display} min-w-0 text-3xl leading-tight font-semibold tracking-tight text-balance ${wrap} sm:text-4xl`}
          >
            {model.name}
          </h1>
          <div className="print:hidden">
            <ShareButton
              {...model.share}
              variant="outline"
              ui={model.header.ui.share}
              newTab={ui.newTab}
            />
          </div>
        </div>
      </header>

      <dl className="mb-8 grid border-y border-line text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
        {rows.map((row) => (
          <div key={row.term} className="contents">
            <dt className={`${small} border-b border-line py-2.5 pe-4 text-muted sm:py-3`}>
              {row.term}
            </dt>
            <dd className={`border-b border-line pb-2.5 sm:py-3 ${wrap}`}>{row.value}</dd>
          </div>
        ))}
      </dl>

      {model.cover && (
        <figure className="mb-8 print:break-inside-avoid">
          <Cover
            cover={model.cover}
            priority
            className="h-auto w-full max-w-4xl border border-line"
          />
        </figure>
      )}

      {model.description && (
        <Part id={`${id}about`} title={ui.pages.details}>
          <p className={`max-w-[68ch] leading-relaxed whitespace-pre-line ${wrap}`}>
            {model.description}
          </p>
        </Part>
      )}

      {model.gallery.length > 0 && (
        <section aria-labelledby={`${id}gallery`} className="mt-9">
          <h2
            id={`${id}gallery`}
            className={`${display} mb-4 border-b border-line pb-2 text-xl font-semibold`}
          >
            {ui.pages.gallery}
          </h2>
          <ol className="grid gap-6 sm:grid-cols-2">
            {model.gallery.map((image, index) => (
              <li key={image.id} className="min-w-0 print:break-inside-avoid">
                <figure>
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full border border-line"
                  />
                  <figcaption className={`mt-1.5 text-xs text-muted ${wrap}`}>
                    <span className="font-semibold tabular-nums">{index + 1}.</span> {image.alt}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(model.previous || model.next) && (
        <nav
          aria-label={ui.pages.otherProjects}
          className="mt-10 grid gap-4 border-t-2 border-ink pt-5 sm:grid-cols-2 print:hidden"
        >
          {model.previous ? (
            <Link
              href={model.previous.href}
              rel="prev"
              className={`flex min-w-0 flex-col border border-line p-3 hover:bg-page ${focusRing}`}
            >
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <ArrowLeft aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
                {ui.pages.previous}
              </span>
              <span className={`mt-1 font-semibold ${wrap}`}>{model.previous.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {model.next && (
            <Link
              href={model.next.href}
              rel="next"
              className={`flex min-w-0 flex-col border border-line p-3 text-end hover:bg-page sm:col-start-2 ${focusRing}`}
            >
              <span className="flex items-center justify-end gap-1.5 text-xs text-muted">
                {ui.pages.next}
                <ArrowRight aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
              </span>
              <span className={`mt-1 font-semibold ${wrap}`}>{model.next.name}</span>
            </Link>
          )}
        </nav>
      )}

      <p className="mt-6 print:hidden">
        <Link href={model.back.href} className={`inline-flex items-center gap-1.5 text-sm ${link}`}>
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {fill(ui.pages.backTo, { page: model.back.label })}
        </Link>
      </p>
    </article>
  );
}

// ---- About: the body of the resume

function About({ model, id, ui, renderBlock, Section }: SubProps<AboutPageModel>) {
  // The skills are in the sidebar, as on every page.
  const blocks = model.blocks.filter((block) => block.kind !== 'skills');
  return (
    <>
      <Band kicker={model.header.name} title={model.title} lede={model.header.tagline} />
      {(model.text || model.facts.length > 0) && (
        <div className="mb-2 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-12 print:block">
          {model.text && (
            <Part id={`${id}summary`} title={ui.pages.aboutHeadline}>
              <p className={`max-w-[68ch] leading-relaxed whitespace-pre-line ${wrap}`}>
                {model.text}
              </p>
            </Part>
          )}
          {(model.facts.length > 0 || model.resume) && (
            <aside
              aria-label={ui.pages.details}
              className="mt-9 min-w-0 lg:mt-0 lg:border-s lg:border-line lg:ps-8 print:border-0 print:ps-0"
            >
              <dl className="text-sm">
                {model.facts.map((fact) => (
                  <div key={fact.label} className="border-b border-line py-2.5 first:pt-0">
                    <dt className={`${small} mb-0.5 text-muted`}>{fact.label}</dt>
                    <dd className={wrap}>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {model.resume && (
                <p className="mt-4 print:hidden">
                  <ResumeLink
                    resume={model.resume}
                    className={`inline-flex items-center gap-2 rounded border border-ink px-3 py-1.5 text-sm font-semibold hover:bg-page ${focusRing}`}
                  />
                </p>
              )}
            </aside>
          )}
        </div>
      )}
      {blocks.map((block) => (
        <Section key={block.id} block={block}>
          {renderBlock(block)}
        </Section>
      ))}
    </>
  );
}

// ---- Contact: a ruled contact sheet

function Contact({ model, id, ui }: SubProps<ContactPageModel>) {
  const { header } = model;
  const row = `flex min-w-0 items-center justify-between gap-3 border-b border-line py-3 text-base hover:bg-page ${focusRing}`;
  return (
    <>
      <Band kicker={header.name} title={model.title} lede={ui.pages.contactIntro} />

      {header.availability && (
        <AvailabilityBadge
          availability={header.availability}
          ui={header.ui}
          className="mb-8 max-w-xl border-y border-line px-0 py-3 text-sm"
          dotClassName="bg-accent-fg"
          linkClassName={link}
        />
      )}

      {(header.links.length > 0 || header.resume) && (
        <section aria-labelledby={`${id}reach`}>
          <h2 id={`${id}reach`} className={`${small} mb-1 text-muted`}>
            {ui.pages.reach}
          </h2>
          <ul className="max-w-xl border-t border-line">
            {header.links.map((item) => (
              <li key={item.id} className="min-w-0">
                <HeaderLink link={item} className={row} />
              </li>
            ))}
            {header.resume && (
              <li className="print:hidden">
                <ResumeLink resume={header.resume} className={row} />
              </li>
            )}
          </ul>
        </section>
      )}

      {model.form && model.state && (
        <Part id={`${id}form`} title={ui.pages.contactHeadline} className="mt-10 print:hidden">
          <div className="max-w-xl">
            <ContactForm
              form={model.form}
              page={model.state}
              buttonClassName={`inline-flex items-center rounded border border-ink px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-page ${focusRing}`}
            />
          </div>
        </Part>
      )}
    </>
  );
}

// ---- a page the owner made

function Custom({ model, renderBlock, Section }: SubProps<CustomPageModel>) {
  return (
    <>
      <Band kicker={model.header.name} title={model.title} />
      {model.body && (
        <div className={`max-w-[68ch] leading-relaxed ${wrap} [&_p+p]:mt-4`}>
          <Markdown>{model.body}</Markdown>
        </div>
      )}
      {model.blocks.map((block) => (
        <div key={block.id} className={model.body ? 'mt-10' : ''}>
          <Section block={block}>{renderBlock(block)}</Section>
        </div>
      ))}
    </>
  );
}

interface SubProps<M> {
  model: M;
  profile: PublicProfile;
  id: string; // the prefix of the ids on the page
  ui: Ui;
  renderBlock: (block: Block) => ReactNode;
  Section: ComponentType<{ block: Block; children: ReactNode }>;
}

export function ExecutivePages({
  profile,
  view,
  nav,
  idPrefix,
  fontClass,
  sidebar,
  footer,
  renderBlock,
  Section,
}: ExecutivePagesProps) {
  const ui = uiFor(profile.locale);
  const id = `${idPrefix}ex-`;
  const shared = { profile, id, ui, renderBlock, Section };
  return (
    <ThemeWrapper theme="executive" profile={profile} nav={nav} className={fontClass}>
      <div className="print:max-w-none print:p-0">
        <div className="exec-sheet bg-surface lg:grid lg:min-h-screen lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)] print:grid print:grid-cols-[13rem_minmax(0,1fr)]">
          {sidebar}
          <main
            id={`${idPrefix}main`}
            className="min-w-0 p-7 sm:p-10 lg:px-[clamp(2.5rem,4vw,6rem)] lg:py-14 print:p-5 print:pt-1"
          >
            {view.kind === 'home' && <Home model={view} {...shared} />}
            {view.kind === 'work' && <Work model={view} {...shared} />}
            {view.kind === 'project' && <Project model={view} {...shared} />}
            {view.kind === 'about' && <About model={view} {...shared} />}
            {view.kind === 'contact' && <Contact model={view} {...shared} />}
            {view.kind === 'custom' && <Custom model={view} {...shared} />}
            {footer}
          </main>
        </div>
      </div>
    </ThemeWrapper>
  );
}
