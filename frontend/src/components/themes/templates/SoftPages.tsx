import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '../../ShareButton';
import { formatMonthYear } from '@/lib/format';
import { fill, translatorFor, type Ui } from '@/lib/i18n';
import type { Block, ProjectEntry } from '../blocks';
import { ContactForm } from '../ContactForm';
import { ReadMore } from '../ReadMore';
import {
  AvailabilityBadge,
  Avatar,
  HeaderLink,
  NewTabLink,
  ProjectCover,
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

// The pages of a multi-page portfolio in the Soft theme: warm and calm. A centered introduction, one
// narrow column, open panels with a hairline, soft tinted chips, a quiet timeline and nothing that moves.
// SoftTheme passes in what lives in its own file (the block renderer, the section frame, the hero and the
// footer), so this file never imports from it.

const display = 'font-(family-name:--font-theme-display)';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const panel = 'rounded-3xl border border-line bg-surface';
const tint = 'rounded-3xl bg-accent-soft';
const chip = 'rounded-full bg-accent-soft px-3.5 py-1 text-sm font-semibold';
const pill = `inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-accent-soft ${focusRing}`;
const solid = `inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-page transition-opacity duration-200 hover:opacity-90 ${focusRing}`;
const textLink = `font-bold text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`;
const wrapText = '[overflow-wrap:anywhere]';
const badgeProps = {
  className:
    'mt-4 max-w-xl justify-center rounded-3xl bg-accent-soft px-4 py-2 text-start text-sm text-ink',
  dotClassName: 'bg-accent-fg',
  linkClassName: textLink,
};
const workCardProps = {
  className: 'max-w-xl rounded-3xl bg-accent-soft px-4 py-3 text-start text-ink',
  linkClassName: textLink,
  buttonClassName: `rounded-full bg-ink px-3 py-1 text-xs font-bold text-page hover:opacity-90 ${focusRing}`,
};

export interface SoftPagesProps {
  profile: PublicProfile;
  view: PageView;
  nav?: ReactNode;
  idPrefix: string;
  fontClass: string;
  renderBlock: (block: Block) => ReactNode;
  Section: ComponentType<{ block: Block; children: ReactNode }>;
  hero: ReactNode; // the theme's own introduction (the centered photo, name and line)
  footer: ReactNode;
}

type Parts = Pick<SoftPagesProps, 'renderBlock' | 'Section' | 'idPrefix'>;

const Arrow = () => <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />;

// A centered page title: the owner's name small above, the page's name large.
function Title({
  kicker,
  title,
  intro,
}: {
  kicker?: string;
  title: string;
  intro?: string | null;
}) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      {kicker && <p className="mb-3 text-sm text-muted">{kicker}</p>}
      <h1
        className={`${display} text-[clamp(2.25rem,7vw,3.75rem)] leading-[1.1] font-medium text-balance ${wrapText}`}
      >
        {title}
      </h1>
      {intro && (
        <p
          className={`mx-auto mt-4 max-w-xl text-lg leading-snug text-pretty text-muted ${wrapText}`}
        >
          {intro}
        </p>
      )}
    </header>
  );
}

// A section of a page: its heading (an h2, with an id for aria-labelledby) and its content.
function Panel({
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
    <section aria-labelledby={id} className={`mt-12 sm:mt-16 ${className}`}>
      <h2
        id={id}
        className={`${display} mb-5 text-2xl font-medium text-balance sm:text-3xl ${wrapText}`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chips({ items, label }: { items: string[]; label?: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2.5">
      {items.map((item) => (
        <li key={item} className={`${chip} ${wrapText}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// A project as a soft panel with its cover. The whole card is the link to the project's page; the
// project elsewhere has its own link above it.
function ProjectCard({
  project,
  ui,
  big = false,
}: {
  project: ProjectEntry;
  ui: Ui;
  big?: boolean;
}) {
  return (
    <li
      className={`${panel} group relative flex min-w-0 flex-col p-5 break-inside-avoid ${big ? 'md:col-span-2 md:p-7' : ''}`}
    >
      <ProjectCover
        project={project}
        className={`mb-4 w-full rounded-2xl object-cover ${big ? 'aspect-[21/9]' : 'aspect-[40/21]'}`}
      />
      <h3
        className={`${display} leading-snug font-medium ${wrapText} ${big ? 'text-3xl' : 'text-xl'}`}
      >
        <Link
          href={project.detailHref}
          className={`underline decoration-line underline-offset-4 group-hover:decoration-current after:absolute after:inset-0 after:rounded-3xl ${focusRing}`}
        >
          {project.name}
        </Link>
      </h3>
      {project.description && (
        <p
          className={`mt-3 flex-1 leading-relaxed text-muted ${wrapText} ${big ? 'line-clamp-4 max-w-2xl' : 'line-clamp-3'}`}
        >
          {project.description}
        </p>
      )}
      {project.tags.length > 0 && (
        <p className={`mt-4 text-sm text-muted ${wrapText}`}>
          {project.tags.slice(0, 5).join(' · ')}
        </p>
      )}
      {project.href && (
        <p className="relative z-10 mt-4">
          <NewTabLink
            href={project.href}
            context={project.name}
            className={`inline-flex items-center gap-1 text-sm ${textLink}`}
          >
            {ui.viewProject}
            <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </NewTabLink>
        </p>
      )}
    </li>
  );
}

// ---- Home: a warm introduction, then a few short pieces that each lead on to their own page.

function Home({ model, parts, hero }: { model: HomeModel; parts: Parts; hero: ReactNode }) {
  const { idPrefix } = parts;
  const ui = model.header.ui;
  const locale = model.header.locale;
  return (
    <>
      {hero}

      {model.now && (
        <p
          className={`mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full bg-accent-soft px-5 py-2 text-center text-sm ${wrapText}`}
        >
          <span className="font-bold">{ui.pages.now}</span>
          <span>
            {fill(ui.pages.atCompany, { role: model.now.role, company: model.now.company })}
            {model.now.open && (
              <>
                {' · '}
                {fill(ui.pages.since, { date: formatMonthYear(model.now.since, locale) })}
              </>
            )}
          </span>
        </p>
      )}

      {model.featured.length > 0 && (
        <Panel id={`${idPrefix}home-work`} title={model.header.ui.sections.projects}>
          <ul className="grid gap-4 md:grid-cols-2">
            {model.featured.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                ui={ui}
                big={index === 0 && model.featured.length % 2 === 1}
              />
            ))}
          </ul>
          {model.work && (
            <p className="mt-6 text-center">
              <Link href={model.work.href} className={`inline-flex items-center gap-2 ${textLink}`}>
                {model.work.label}
                <Arrow />
              </Link>
            </p>
          )}
        </Panel>
      )}

      {model.about && (
        <Panel id={`${idPrefix}home-about`} title={model.aboutTitle}>
          <div className={`${panel} p-6 sm:p-8`}>
            <ReadMore
              text={model.about.text}
              locale={locale}
              from={700}
              lines={7}
              className="text-lg leading-8"
            />
            {model.about.href && (
              <p className="mt-5">
                <Link
                  href={model.about.href}
                  className={`inline-flex items-center gap-2 ${textLink}`}
                >
                  {model.about.label}
                  <Arrow />
                </Link>
              </p>
            )}
          </div>
        </Panel>
      )}

      {model.skills.length > 0 && (
        <Panel id={`${idPrefix}home-skills`} title={ui.sections.skills}>
          <Chips items={model.skills} />
          {model.skillsTotal > model.skills.length && (
            <p className="mt-4 text-sm text-muted">
              {fill(ui.pages.skillsMore, { count: model.skillsTotal - model.skills.length })}
            </p>
          )}
        </Panel>
      )}

      {model.testimonial && (
        <section aria-label={ui.pages.kindWords} className="mt-12 sm:mt-16">
          <figure className={`${tint} mx-auto max-w-2xl p-6 sm:p-8`}>
            <blockquote
              className={`${display} text-xl leading-relaxed whitespace-pre-line ${wrapText}`}
            >
              {model.testimonial.message}
            </blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-bold">{model.testimonial.name}</span>
              {model.testimonial.detail && (
                <span className="text-muted"> · {model.testimonial.detail}</span>
              )}
            </figcaption>
          </figure>
        </section>
      )}

      {model.writing && (
        <parts.Section block={model.writing}>{parts.renderBlock(model.writing)}</parts.Section>
      )}

      {model.more && <MoreLinkView more={model.more} className="mt-10 text-center" />}
      {model.cta && (
        <section
          aria-labelledby={`${idPrefix}home-contact`}
          className={`${tint} mt-14 p-8 text-center sm:mt-20 sm:p-12`}
        >
          <h2
            id={`${idPrefix}home-contact`}
            className={`${display} text-3xl font-medium text-balance sm:text-4xl`}
          >
            {model.cta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-pretty">{model.cta.text}</p>
          <p className="mt-6">
            <Link href={model.cta.href} className={solid}>
              {model.cta.label}
              <Arrow />
            </Link>
          </p>
        </section>
      )}
      {!model.cta && model.contact && (
        <parts.Section block={model.contact}>{parts.renderBlock(model.contact)}</parts.Section>
      )}
    </>
  );
}

// ---- Work: a calm index of everything, the first project wide.

function Work({ model, parts }: { model: WorkPageModel; parts: Parts }) {
  const { header } = model;
  const count = translatorFor(header.locale)('pages.projectCount', {
    count: model.projects.length,
  });
  return (
    <>
      <Title
        kicker={header.name}
        title={model.title}
        intro={model.intro ?? header.ui.pages.workIntro}
      />
      <p className="mt-3 text-center text-sm text-muted">{count}</p>
      {model.tags.length > 0 && (
        <section aria-label={header.ui.pages.tagsLabel} className="mt-8">
          <div className="flex justify-center">
            <Chips items={model.tags.map((tag) => tag.name)} />
          </div>
        </section>
      )}
      {model.before.map((block) => (
        <parts.Section key={block.id} block={block}>
          {parts.renderBlock(block)}
        </parts.Section>
      ))}
      <section aria-label={model.title} className="mt-10 sm:mt-14">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" id={`${parts.idPrefix}work-list`}>
          {model.projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              ui={header.ui}
              big={index === 0 && model.projects.length >= 3}
            />
          ))}
        </ul>
      </section>
      {model.blocks.map((block) => (
        <parts.Section key={block.id} block={block}>
          {parts.renderBlock(block)}
        </parts.Section>
      ))}
    </>
  );
}

// ---- A project: a centered case study.

function Neighbour({
  neighbour,
  label,
  rel,
  end,
}: {
  neighbour: NonNullable<ProjectPageModel['previous']>;
  label: string;
  rel: 'prev' | 'next';
  end?: boolean;
}) {
  return (
    <Link
      href={neighbour.href}
      rel={rel}
      className={`${panel} flex min-w-0 flex-col p-5 transition-colors duration-200 hover:bg-accent-soft ${end ? 'text-end' : ''} ${focusRing}`}
    >
      <span className={`flex items-center gap-1.5 text-sm text-muted ${end ? 'justify-end' : ''}`}>
        {!end && <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
        {label}
        {end && <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
      </span>
      <span className={`${display} mt-1 text-lg font-medium ${wrapText}`}>{neighbour.name}</span>
    </Link>
  );
}

function Project({ model }: { model: ProjectPageModel }) {
  const { header } = model;
  const ui = header.ui;
  const hasNeighbours = model.previous || model.next;
  return (
    <article className="mx-auto max-w-3xl">
      <Breadcrumbs crumbs={model.crumbs} label={ui.pages.breadcrumbs} />
      <header className="text-center">
        <p className="mb-3 text-sm text-muted">
          {ui.pages.caseStudy}
          {model.total > 1 && (
            <> · {fill(ui.pages.projectOf, { n: model.position, total: model.total })}</>
          )}
        </p>
        <h1
          className={`${display} text-[clamp(2rem,6.5vw,3.5rem)] leading-[1.1] font-medium text-balance ${wrapText}`}
        >
          {model.name}
        </h1>
        {model.tags.length > 0 && (
          <div className="mt-5 flex justify-center">
            <Chips items={model.tags} label={ui.pages.tech} />
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
          {model.external && (
            <NewTabLink href={model.external} context={model.name} className={solid}>
              {ui.pages.visit}
              <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            </NewTabLink>
          )}
          <ShareButton
            url={model.share.url}
            title={model.share.title}
            message={model.share.message}
            subject={model.share.subject}
            variant="outline"
            ui={ui.share}
            newTab={ui.newTab}
          />
        </div>
      </header>

      {model.cover && (
        // A plain <img>: Cloudinary serves it already cropped. It is the first thing on the page, so it
        // loads at once, and its size is in the attributes so no space jumps.
        <img
          src={model.cover.src}
          alt={model.cover.alt || model.name}
          width={model.cover.width}
          height={model.cover.height}
          fetchPriority="high"
          decoding="async"
          className="mt-10 h-auto w-full rounded-3xl border border-line print:break-inside-avoid"
        />
      )}

      {model.description && (
        <p
          className={`mx-auto mt-10 max-w-[62ch] text-lg leading-8 whitespace-pre-line sm:text-xl sm:leading-9 ${wrapText}`}
        >
          {model.description}
        </p>
      )}

      {model.gallery.length > 0 && (
        <section aria-label={ui.pages.gallery} className="mt-12">
          <ul className="grid gap-4 sm:grid-cols-2">
            {model.gallery.map((image, index) => (
              <li
                key={image.id}
                className={`min-w-0 print:break-inside-avoid ${model.gallery.length % 2 === 1 && index === 0 ? 'sm:col-span-2' : ''}`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full rounded-2xl border border-line"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasNeighbours && (
        <nav
          aria-label={ui.pages.otherProjects}
          className="mt-14 grid gap-4 sm:grid-cols-2 print:hidden"
        >
          {model.previous ? (
            <Neighbour neighbour={model.previous} label={ui.pages.previous} rel="prev" />
          ) : (
            <span />
          )}
          {model.next && <Neighbour neighbour={model.next} label={ui.pages.next} rel="next" end />}
        </nav>
      )}

      <p className="mt-10 text-center print:hidden">
        <Link
          href={model.back.href}
          className={`inline-flex items-center gap-2 text-sm ${textLink}`}
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {fill(ui.pages.backTo, { page: model.back.label })}
        </Link>
      </p>
    </article>
  );
}

// ---- About: the person first, then the story.

function About({ model, parts }: { model: AboutPageModel; parts: Parts }) {
  const { header } = model;
  const ui = header.ui;
  return (
    <>
      <Title kicker={header.name} title={model.title} />
      <div className="mt-8 flex flex-col items-center text-center">
        <Avatar
          avatar={header.avatar}
          className="size-36 rounded-full ring-4 ring-surface sm:size-48"
          placeholderClassName={`${display} bg-accent-soft text-6xl font-medium text-ink`}
        />
        {header.tagline && (
          <p
            className={`${display} mt-6 max-w-xl text-2xl leading-snug text-balance sm:text-3xl ${wrapText}`}
          >
            {header.tagline}
          </p>
        )}
      </div>

      {model.text && (
        <section aria-label={ui.pages.aboutHeadline} className="mx-auto mt-10 max-w-2xl">
          <ReadMore
            text={model.text}
            locale={header.locale}
            from={1400}
            lines={14}
            className="text-lg leading-8 sm:text-xl sm:leading-9"
          />
        </section>
      )}

      {model.facts.length > 0 && (
        <section aria-label={ui.pages.details} className="mt-10">
          <dl className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-3">
            {model.facts.map((fact) => (
              <div key={fact.label} className={`${tint} min-w-0 px-5 py-4 text-center`}>
                <dt className="flex items-center justify-center gap-1.5 text-sm text-muted">
                  {fact.label === ui.pages.factLocation && (
                    <MapPin aria-hidden="true" className="size-3.5" />
                  )}
                  {fact.label}
                </dt>
                <dd className={`${display} mt-1 text-lg font-medium ${wrapText}`}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {(header.links.length > 0 || model.resume) && (
        <ul
          aria-label={ui.pages.links}
          className="mt-8 flex flex-wrap justify-center gap-2.5 print:hidden"
        >
          {header.links.map((link) => (
            <li key={link.id} className="max-w-full">
              <HeaderLink link={link} className={pill} />
            </li>
          ))}
          {model.resume && (
            <li>
              <ResumeLink resume={model.resume} className={pill} />
            </li>
          )}
        </ul>
      )}

      {model.blocks.map((block) => (
        <parts.Section key={block.id} block={block}>
          {parts.renderBlock(block)}
        </parts.Section>
      ))}
    </>
  );
}

// ---- Contact: a warm headline, then every way to reach the owner.

function Contact({ model, parts }: { model: ContactPageModel; parts: Parts }) {
  const { header } = model;
  const ui = header.ui;
  return (
    <>
      <Title kicker={header.name} title={model.title} intro={ui.pages.contactIntro} />
      <div className="mt-6 flex justify-center">
        <AvailabilityBadge availability={header.availability} ui={ui} {...badgeProps} />
      </div>

      {header.links.length > 0 && (
        <section aria-label={ui.pages.reach} className="mt-8">
          <ul className="flex flex-wrap justify-center gap-2.5">
            {header.links.map((link) => (
              <li key={link.id} className="max-w-full">
                <HeaderLink link={link} className={pill} />
              </li>
            ))}
            {header.resume && (
              <li>
                <ResumeLink resume={header.resume} className={pill} />
              </li>
            )}
          </ul>
        </section>
      )}

      {model.work && (
        <div className="mt-8 flex justify-center">
          <WorkCard work={model.work} {...workCardProps} />
        </div>
      )}

      {model.form && model.state && (
        <section
          aria-labelledby={`${parts.idPrefix}contact-form`}
          className={`${panel} mx-auto mt-10 max-w-xl p-6 sm:p-8 print:hidden`}
        >
          <h2
            id={`${parts.idPrefix}contact-form`}
            className={`${display} mb-4 text-2xl font-medium text-balance`}
          >
            {fill(ui.contactForm.pageTitle, { name: header.name })}
          </h2>
          <ContactForm form={model.form} page={model.state} buttonClassName={solid} />
        </section>
      )}
    </>
  );
}

// ---- A page the owner made: a title, their words, and the sections they put on it.

function Custom({ model, parts }: { model: CustomPageModel; parts: Parts }) {
  return (
    <>
      <Title kicker={model.header.name} title={model.title} />
      {model.body && (
        <div
          className={`mx-auto mt-10 max-w-[62ch] text-lg leading-8 sm:text-xl sm:leading-9 ${wrapText}`}
        >
          <Markdown>{model.body}</Markdown>
        </div>
      )}
      {model.blocks.map((block) => (
        <parts.Section key={block.id} block={block}>
          {parts.renderBlock(block)}
        </parts.Section>
      ))}
    </>
  );
}

export function SoftPages({
  profile,
  view,
  nav,
  idPrefix,
  fontClass,
  renderBlock,
  Section,
  hero,
  footer,
}: SoftPagesProps) {
  const parts: Parts = { renderBlock, Section, idPrefix };
  return (
    <ThemeWrapper theme="soft" profile={profile} nav={nav} className={fontClass}>
      <main id={`${idPrefix}main`} className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {view.kind === 'home' && <Home model={view} parts={parts} hero={hero} />}
        {view.kind === 'work' && <Work model={view} parts={parts} />}
        {view.kind === 'project' && <Project model={view} />}
        {view.kind === 'about' && <About model={view} parts={parts} />}
        {view.kind === 'contact' && <Contact model={view} parts={parts} />}
        {view.kind === 'custom' && <Custom model={view} parts={parts} />}
      </main>
      {footer}
    </ThemeWrapper>
  );
}
