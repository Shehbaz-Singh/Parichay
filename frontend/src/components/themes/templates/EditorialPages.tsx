import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '@/components/ShareButton';
import { formatMonthYear } from '@/lib/format';
import { fill, translatorFor, uiFor } from '@/lib/i18n';
import type { Block, HeaderModel, ProjectEntry } from '../blocks';
import { ContactForm } from '../ContactForm';
import {
  AvailabilityBadge,
  Avatar,
  ContactLink,
  HeaderLink,
  NewTabLink,
  ResumeLink,
  MoreLinkView,
} from '../parts';
import { ReadMore } from '../ReadMore';
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
import { editorialLink as link, focusRing, display, wrap } from '@/components/themes/tokens';

// The pages of a multi-page portfolio in the Editorial theme: a quiet magazine. Serif display type, a
// narrow reading column, thin rules, small-capital labels and italic captions. Each page is laid out as a
// spread of its own: Home leads with the masthead and a cover-led feature of the work, Work is a numbered
// contents list, a project is a long-form article, About is a portrait beside a statement, Contact is one
// large headline with the ways to reach the owner and the form. The data is decided in ./model; this file
// only draws it. It does not import the theme (the theme imports this), so what it needs from the theme
// arrives as props.

const caps = 'text-xs font-semibold tracking-[0.18em] uppercase';
const title1 = `${display} text-5xl leading-[0.98] font-medium tracking-tight text-balance ${wrap} sm:text-7xl lg:text-8xl`;

export interface EditorialPagesProps {
  profile: PublicProfile;
  view: PageView;
  nav?: ReactNode;
  idPrefix: string;
  fontClass: string;
  hero: ReactNode; // the theme's own masthead, the introduction of the Home page
  renderBlock: (block: Block) => ReactNode; // the theme's drawing of a section's content
  Section: ComponentType<{ block: Block; children: ReactNode }>; // the theme's section with its label
  footer: ReactNode;
}

// ---- pieces

// A labelled part of a page: the label in small capitals on a rule, sticky in a left rail on wide screens.
function Rail({
  id,
  title,
  aside,
  children,
  className = 'mt-16 sm:mt-24',
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`${className} lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-x-20`}
    >
      <div className="mb-8 lg:sticky lg:top-[calc(2rem+var(--nav-h,0px))] lg:mb-0 lg:self-start">
        <h2
          id={id}
          className={`${caps} flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3`}
        >
          <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
          <span className="min-w-0">{title}</span>
          <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line lg:hidden" />
        </h2>
        {aside && <div className="mt-3 hidden text-sm lg:block">{aside}</div>}
      </div>
      <div className="min-w-0">
        {children}
        {aside && <div className="mt-8 text-sm lg:hidden">{aside}</div>}
      </div>
    </section>
  );
}

// The page's title: the owner's name as a small italic line, then the title large between two rules.
function PageTitle({
  kicker,
  title,
  intro,
  children,
}: {
  kicker?: string;
  title: string;
  intro?: string | null;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-ink pb-8 sm:pb-10">
      {kicker && <p className={`${display} mb-4 text-lg text-muted italic`}>{kicker}</p>}
      <h1 className={title1}>{title}</h1>
      {intro && (
        <p
          className={`${display} mt-6 max-w-3xl text-xl leading-snug text-muted italic sm:text-2xl ${wrap}`}
        >
          {intro}
        </p>
      )}
      {children}
    </header>
  );
}

// The owner, small, for the top of a page that is not Home: photo, name, line.
function Byline({ header, className = '' }: { header: HeaderModel; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Avatar
        avatar={header.avatar}
        className="size-12 shrink-0 rounded-full"
        placeholderClassName={`${display} border border-ink text-lg text-ink`}
      />
      <p className="min-w-0 text-sm leading-snug">
        <span className={`${display} block text-lg font-medium ${wrap}`}>{header.name}</span>
        {header.tagline && (
          <span className={`block text-muted italic ${wrap}`}>{header.tagline}</span>
        )}
      </p>
    </div>
  );
}

function Cover({
  cover,
  alt,
  eager = false,
  className,
}: {
  cover: NonNullable<ProjectEntry['cover']>;
  alt?: string;
  eager?: boolean;
  className: string;
}) {
  return (
    // A plain <img>: the cover comes from Cloudinary, already cropped to 1200 x 630. The size is in the
    // attributes so the space is kept before it loads.
    <img
      src={cover.src}
      alt={alt ?? cover.alt}
      width={cover.width}
      height={cover.height}
      loading={eager ? undefined : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  );
}

const numeral = (index: number) => String(index + 1).padStart(2, '0');

// A project as a feature: the cover (or a large numeral when there is none) beside the title, the
// description, the technologies, and a way to the project's own page. Whole-card link on the title.
function Feature({
  project,
  index,
  ui,
  locale,
  flip = false,
  lead = false,
  eager = false,
}: {
  project: ProjectEntry;
  index: number;
  ui: ReturnType<typeof uiFor>;
  locale: string;
  flip?: boolean;
  lead?: boolean;
  eager?: boolean;
}) {
  return (
    <li className="ed-hover group relative min-w-0 break-inside-avoid">
      <div
        className={`grid items-center gap-6 lg:gap-12 ${
          lead ? 'lg:grid-cols-12' : 'lg:grid-cols-12'
        }`}
      >
        <div
          className={`min-w-0 ${lead ? 'lg:col-span-7' : 'lg:col-span-6'} ${flip ? 'lg:order-2' : ''}`}
        >
          {project.cover ? (
            <Cover
              cover={project.cover}
              eager={eager}
              className="aspect-[40/21] w-full border border-line object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className={`${display} flex aspect-[40/21] w-full items-center justify-center border border-line bg-surface text-[clamp(4rem,12vw,9rem)] leading-none text-muted italic`}
            >
              {numeral(index)}
            </div>
          )}
        </div>
        <div className={`min-w-0 ${lead ? 'lg:col-span-5' : 'lg:col-span-6'}`}>
          <p className={`${caps} text-muted`}>
            <span
              aria-hidden="true"
              className={`${display} me-2 tracking-normal normal-case italic`}
            >
              {numeral(index)}
            </span>
            {project.tags.slice(0, 3).join(' · ')}
          </p>
          <h3
            className={`${display} mt-3 leading-tight font-medium ${wrap} ${
              lead ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
            }`}
          >
            <Link href={project.detailHref} className={`after:absolute after:inset-0 ${focusRing}`}>
              <span className="ed-underline">{project.name}</span>
            </Link>
          </h3>
          {project.description && (
            <ReadMore
              text={project.description}
              locale={locale}
              lines={3}
              className={`mt-4 leading-relaxed ${wrap}`}
            />
          )}
          {project.href && (
            <p className="relative z-10 mt-4 text-sm">
              <NewTabLink href={project.href} context={project.name} className={link}>
                {ui.pages.visit}
              </NewTabLink>
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

// ---- Home

function Home({
  view,
  profile,
  hero,
  renderBlock,
  Section,
}: {
  view: HomeModel;
  profile: PublicProfile;
  hero: ReactNode;
  renderBlock: EditorialPagesProps['renderBlock'];
  Section: EditorialPagesProps['Section'];
}) {
  const ui = uiFor(profile.locale);
  const t = translatorFor(profile.locale);
  const [first, ...more] = view.featured;
  return (
    <>
      {hero}

      {first && (
        <Rail
          id="home-work"
          title={ui.sections.projects}
          aside={
            view.work && (
              <Link href={view.work.href} className={`inline-flex items-center gap-1.5 ${link}`}>
                {ui.pages.allWork}
                <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </Link>
            )
          }
        >
          <p className={`${display} mb-10 text-lg text-muted italic`}>
            {t('pages.projectCount', { count: view.projectTotal })}
          </p>
          <ul className="space-y-16 sm:space-y-24">
            <Feature project={first} index={0} ui={ui} locale={profile.locale} lead />
            {more.length > 0 && (
              <li className="min-w-0">
                <ul className="grid gap-x-12 gap-y-14 md:grid-cols-2">
                  {more.map((project, index) => (
                    <li
                      key={project.id}
                      className="ed-hover group relative min-w-0 break-inside-avoid"
                    >
                      {project.cover && (
                        <Cover
                          cover={project.cover}
                          alt=""
                          className="mb-4 aspect-[40/21] w-full border border-line object-cover"
                        />
                      )}
                      <p className={`${caps} text-muted`}>
                        <span
                          aria-hidden="true"
                          className={`${display} me-2 tracking-normal normal-case italic`}
                        >
                          {numeral(index + 1)}
                        </span>
                        {project.tags.slice(0, 2).join(' · ')}
                      </p>
                      <h3
                        className={`${display} mt-2 text-2xl leading-tight font-medium sm:text-3xl ${wrap}`}
                      >
                        <Link
                          href={project.detailHref}
                          className={`after:absolute after:inset-0 ${focusRing}`}
                        >
                          <span className="ed-underline">{project.name}</span>
                        </Link>
                      </h3>
                      {project.description && (
                        <ReadMore
                          text={project.description}
                          locale={profile.locale}
                          lines={2}
                          className={`mt-3 leading-relaxed ${wrap}`}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </Rail>
      )}

      {view.about && (
        <Rail id="home-about" title={view.aboutTitle}>
          <p
            className={`${display} max-w-4xl text-2xl leading-[1.5] whitespace-pre-line text-pretty first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:text-[5rem] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-accent-fg sm:text-[1.9rem] ${wrap}`}
          >
            {view.about.text}
          </p>
          {view.about.href && (
            <p className="mt-8 text-sm">
              <Link href={view.about.href} className={`inline-flex items-center gap-1.5 ${link}`}>
                {view.about.label}
                <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </Link>
            </p>
          )}
        </Rail>
      )}

      {view.now && (
        <p
          className={`${display} mt-12 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-line py-4 text-lg italic ${wrap}`}
        >
          <span className={`${caps} text-muted not-italic`}>{ui.pages.now}</span>
          <span>
            {fill(ui.pages.atCompany, { role: view.now.role, company: view.now.company })}
            {view.now.open && (
              <span className="text-muted">
                {', '}
                {fill(ui.pages.since, { date: formatMonthYear(view.now.since, profile.locale) })}
              </span>
            )}
          </span>
        </p>
      )}

      {view.skills.length > 0 && (
        <p className={`${display} mt-6 text-lg text-muted italic ${wrap}`}>
          {view.skills.join(' · ')}
          {view.skillsTotal > view.skills.length &&
            ` · ${fill(ui.pages.skillsMore, { count: view.skillsTotal - view.skills.length })}`}
        </p>
      )}

      {view.more && <MoreLinkView more={view.more} className="mt-8" />}
      {view.testimonial && (
        <Rail id="home-kind" title={ui.pages.kindWords}>
          <figure className="max-w-4xl">
            <blockquote
              className={`${display} text-2xl leading-snug whitespace-pre-line italic sm:text-4xl ${wrap}`}
            >
              <span aria-hidden="true" className="me-2 text-accent-fg">
                “
              </span>
              {view.testimonial.message}
            </blockquote>
            <figcaption className="mt-6 text-sm">
              <span className="font-semibold">{view.testimonial.name}</span>
              {view.testimonial.detail && (
                <span className="text-muted">, {view.testimonial.detail}</span>
              )}
            </figcaption>
          </figure>
        </Rail>
      )}

      {view.writing && <Section block={view.writing}>{renderBlock(view.writing)}</Section>}

      {view.cta ? (
        <section
          aria-labelledby="home-cta"
          className="mt-20 border-y border-ink py-14 text-center sm:mt-28 sm:py-20"
        >
          <h2 id="home-cta" className={`${caps} text-muted`}>
            {view.cta.title}
          </h2>
          <p
            className={`${display} mx-auto mt-5 max-w-3xl text-3xl leading-tight text-balance italic sm:text-5xl ${wrap}`}
          >
            {view.cta.text}
          </p>
          <p className="mt-8 print:hidden">
            <Link
              href={view.cta.href}
              className={`inline-flex items-center gap-2 text-lg font-medium ${link}`}
            >
              {view.cta.label}
              <ArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            </Link>
          </p>
        </section>
      ) : (
        view.contact && <Section block={view.contact}>{renderBlock(view.contact)}</Section>
      )}
    </>
  );
}

// ---- Work

function Work({
  view,
  profile,
  renderBlock,
  Section,
}: {
  view: WorkPageModel;
  profile: PublicProfile;
  renderBlock: EditorialPagesProps['renderBlock'];
  Section: EditorialPagesProps['Section'];
}) {
  const ui = uiFor(profile.locale);
  const t = translatorFor(profile.locale);
  return (
    <>
      <PageTitle kicker={view.header.name} title={view.title} intro={view.intro}>
        <Byline header={view.header} className="mt-8" />
      </PageTitle>
      {view.before.map((block) => (
        <Section key={block.id} block={block}>
          {renderBlock(block)}
        </Section>
      ))}
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-line pb-6">
        <p className={`${display} text-lg text-muted italic`}>
          {t('pages.projectCount', { count: view.projects.length })}
        </p>
        {view.tags.length > 0 && (
          <p className={`${display} min-w-0 max-w-3xl text-lg italic ${wrap}`}>
            <span className={`${caps} me-3 text-muted not-italic`}>{ui.pages.tagsLabel}</span>
            {view.tags.map((tag) => tag.name).join(' · ')}
          </p>
        )}
      </div>
      <ul className="mt-12 space-y-16 sm:mt-16 sm:space-y-28">
        {view.projects.map((project, index) => (
          <Feature
            key={project.id}
            project={project}
            index={index}
            ui={ui}
            locale={profile.locale}
            lead={index === 0}
            flip={index % 2 === 1}
            eager={index === 0}
          />
        ))}
      </ul>
      {view.blocks.map((block) => (
        <Section key={block.id} block={block}>
          {renderBlock(block)}
        </Section>
      ))}
    </>
  );
}

// ---- a project: a long-form article

function ProjectArticle({ view, profile }: { view: ProjectPageModel; profile: PublicProfile }) {
  const ui = uiFor(profile.locale);
  return (
    <article>
      <Breadcrumbs crumbs={view.crumbs} label={ui.pages.breadcrumbs} />
      <header className="border-b border-ink pb-8 sm:pb-10">
        <p className={`${caps} text-muted`}>
          {ui.pages.caseStudy}
          <span aria-hidden="true"> · </span>
          {fill(ui.pages.projectOf, { n: view.position, total: view.total })}
        </p>
        <h1 className={`${title1} mt-4`}>{view.name}</h1>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <Byline header={view.header} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm print:hidden">
            {view.external && (
              <NewTabLink
                href={view.external}
                context={view.name}
                className={`inline-flex items-center gap-1.5 text-base font-medium ${link}`}
              >
                {ui.pages.visit}
                <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </NewTabLink>
            )}
            <ShareButton {...view.share} ui={ui.share} newTab={ui.newTab} variant="outline" />
          </div>
        </div>
      </header>

      {view.cover && (
        <figure className="mt-10 sm:mt-14">
          <Cover
            cover={view.cover}
            alt={view.cover.alt || view.name}
            eager
            className="h-auto w-full border border-line print:break-inside-avoid"
          />
        </figure>
      )}

      <div className="mt-12 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-x-20">
        <aside aria-label={ui.pages.details} className="mb-10 lg:mb-0">
          {view.tags.length > 0 && (
            <section aria-labelledby="project-tech" className="border-t border-ink pt-4">
              <h2 id="project-tech" className={`${caps} text-muted`}>
                {ui.pages.technologies}
              </h2>
              <ul className={`${display} mt-3 space-y-1 text-lg italic`}>
                {view.tags.map((tag) => (
                  <li key={tag} className={wrap}>
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
        <div className="min-w-0">
          {view.description && (
            <p
              className={`${display} max-w-3xl text-xl leading-[1.7] whitespace-pre-line first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-accent-fg sm:text-[1.35rem] ${wrap}`}
            >
              {view.description}
            </p>
          )}
        </div>
      </div>

      {view.gallery.length > 0 && (
        <section aria-label={ui.pages.gallery} className="mt-16 sm:mt-24">
          <ul className="grid gap-x-10 gap-y-12 md:grid-cols-2">
            {view.gallery.map((image, index) => (
              <li
                key={image.id}
                className={`min-w-0 print:break-inside-avoid ${index % 3 === 0 ? 'md:col-span-2' : ''}`}
              >
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
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(view.previous || view.next) && (
        <nav
          aria-label={ui.pages.otherProjects}
          className="mt-20 grid gap-8 border-t border-ink pt-8 sm:mt-28 sm:grid-cols-2 print:hidden"
        >
          {view.previous ? (
            <Neighbour label={ui.pages.previous} item={view.previous} rel="prev" />
          ) : (
            <span />
          )}
          {view.next && <Neighbour label={ui.pages.next} item={view.next} rel="next" end />}
        </nav>
      )}

      <p className="mt-12 print:hidden">
        <Link href={view.back.href} className={`inline-flex items-center gap-1.5 text-sm ${link}`}>
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {fill(ui.pages.backTo, { page: view.back.label })}
        </Link>
      </p>
    </article>
  );
}

function Neighbour({
  label,
  item,
  rel,
  end = false,
}: {
  label: string;
  item: NonNullable<ProjectPageModel['previous']>;
  rel: 'prev' | 'next';
  end?: boolean;
}) {
  return (
    <Link
      href={item.href}
      rel={rel}
      className={`ed-hover group flex min-w-0 flex-col gap-4 ${end ? 'sm:col-start-2 sm:text-end' : ''} ${focusRing}`}
    >
      {item.cover && (
        <Cover
          cover={item.cover}
          alt=""
          className="aspect-[40/21] w-full border border-line object-cover"
        />
      )}
      <span className={`${caps} flex items-center gap-2 text-muted ${end ? 'sm:justify-end' : ''}`}>
        {!end && <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
        {label}
        {end && <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
      </span>
      <span className={`${display} text-2xl leading-tight font-medium sm:text-3xl ${wrap}`}>
        <span className="ed-underline">{item.name}</span>
      </span>
    </Link>
  );
}

// ---- About

function About({
  view,
  profile,
  renderBlock,
  Section,
}: {
  view: AboutPageModel;
  profile: PublicProfile;
  renderBlock: EditorialPagesProps['renderBlock'];
  Section: EditorialPagesProps['Section'];
}) {
  const ui = uiFor(profile.locale);
  const { header } = view;
  return (
    <>
      <PageTitle kicker={header.name} title={view.title} />
      <div className="mt-10 lg:mt-14 lg:grid lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:gap-x-16 xl:gap-x-24">
        <aside aria-label={ui.pages.details} className="min-w-0">
          <div className="lg:sticky lg:top-[calc(2rem+var(--nav-h,0px))]">
            <Avatar
              avatar={header.avatar}
              className="aspect-[4/5] w-full max-w-xs border border-line object-cover lg:max-w-none"
              placeholderClassName={`${display} bg-surface text-8xl text-muted italic`}
            />
            <p className={`${display} mt-5 text-2xl font-medium ${wrap}`}>{header.name}</p>
            {header.tagline && (
              <p className={`${display} mt-1 text-lg leading-snug text-muted italic ${wrap}`}>
                {header.tagline}
              </p>
            )}
            {view.facts.length > 0 && (
              <dl className="mt-6 border-t border-ink">
                {view.facts.map((fact) => (
                  <div key={fact.label} className="border-b border-line py-3">
                    <dt className={`${caps} text-muted`}>{fact.label}</dt>
                    <dd className={`${display} mt-1 text-lg ${wrap}`}>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {header.links.map((item) => (
                <li key={item.id} className="max-w-full">
                  <HeaderLink link={item} className={`inline-flex items-center gap-2 ${link}`} />
                </li>
              ))}
              {view.resume && (
                <li>
                  <ResumeLink
                    resume={view.resume}
                    className={`inline-flex items-center gap-2 ${link}`}
                  />
                </li>
              )}
            </ul>
          </div>
        </aside>
        <div className="mt-12 min-w-0 lg:mt-0">
          {view.text && (
            <section aria-labelledby="about-statement">
              <h2
                id="about-statement"
                className={`${caps} mb-6 flex items-center gap-4 text-muted`}
              >
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
                {ui.pages.aboutHeadline}
              </h2>
              <p
                className={`${display} max-w-3xl text-2xl leading-[1.55] whitespace-pre-line first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:text-[5rem] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-accent-fg sm:text-[1.7rem] ${wrap}`}
              >
                {view.text}
              </p>
            </section>
          )}
          {view.blocks.map((block) => (
            <Section key={block.id} block={block}>
              {renderBlock(block)}
            </Section>
          ))}
        </div>
      </div>
    </>
  );
}

// ---- Contact

function Contact({ view, profile }: { view: ContactPageModel; profile: PublicProfile }) {
  const ui = uiFor(profile.locale);
  const { header } = view;
  return (
    <>
      <PageTitle kicker={header.name} title={view.title} intro={ui.pages.contactIntro} />
      <div className="mt-12 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-x-16">
        <section aria-labelledby="contact-reach" className="min-w-0 lg:col-span-6">
          <h2 id="contact-reach" className={`${caps} mb-6 flex items-center gap-4 text-muted`}>
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
            {ui.pages.reach}
          </h2>
          <Byline header={header} className="mb-8" />
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="mb-8 w-fit max-w-full border border-line px-4 py-2.5 text-start text-sm text-ink"
            dotClassName="bg-accent-fg"
            linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          />
          {header.links.length > 0 && (
            <ul className="border-t border-ink">
              {header.links.map((item) => (
                <li key={item.id} className="border-b border-line">
                  <HeaderLink
                    link={item}
                    className={`${display} flex items-center gap-3 py-4 text-2xl hover:text-accent-fg ${wrap} ${focusRing} sm:text-3xl`}
                  />
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm print:hidden">
            {header.contact && (
              <li>
                <ContactLink
                  contact={header.contact}
                  className={`inline-flex items-center gap-2 ${link}`}
                />
              </li>
            )}
            {header.resume && (
              <li>
                <ResumeLink
                  resume={header.resume}
                  className={`inline-flex items-center gap-2 ${link}`}
                />
              </li>
            )}
          </ul>
          {view.work && (
            <WorkCard
              work={view.work}
              className="mt-8 max-w-md border border-line px-4 py-3 text-start text-ink"
              linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
            />
          )}
        </section>
        {view.form && (
          <section
            aria-labelledby="contact-form"
            className="mt-14 min-w-0 border-t border-ink pt-8 lg:col-span-6 lg:mt-0 lg:border-t-0 lg:border-s lg:ps-16 lg:pt-0 print:hidden"
          >
            <h2
              id="contact-form"
              className={`${display} text-3xl leading-tight italic sm:text-4xl`}
            >
              {ui.pages.contactHeadline}
            </h2>
            <div className="mt-6 max-w-xl">
              <ContactForm
                form={view.form}
                page={view.state ?? undefined}
                buttonClassName={`inline-flex items-center text-sm font-medium ${link}`}
              />
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ---- a page the owner made

function Custom({
  view,
  renderBlock,
  Section,
}: {
  view: CustomPageModel;
  renderBlock: EditorialPagesProps['renderBlock'];
  Section: EditorialPagesProps['Section'];
}) {
  return (
    <>
      <PageTitle kicker={view.header.name} title={view.title}>
        <Byline header={view.header} className="mt-8" />
      </PageTitle>
      {view.body && (
        <div
          className={`mt-12 max-w-3xl text-lg leading-8 sm:text-xl sm:leading-9 [&_.wr-display]:font-(family-name:--font-theme-display) ${wrap}`}
        >
          <Markdown>{view.body}</Markdown>
        </div>
      )}
      {view.blocks.map((block) => (
        <Section key={block.id} block={block}>
          {renderBlock(block)}
        </Section>
      ))}
    </>
  );
}

// ---- the page

export function EditorialPages({
  profile,
  view,
  nav,
  idPrefix,
  fontClass,
  hero,
  renderBlock,
  Section,
  footer,
}: EditorialPagesProps) {
  return (
    <ThemeWrapper theme="editorial" profile={profile} nav={nav} className={fontClass}>
      <main
        id={`${idPrefix}main`}
        className="mx-auto max-w-[110rem] px-5 py-10 sm:px-8 sm:py-16 lg:px-[clamp(3rem,6vw,8rem)]"
      >
        {view.kind === 'home' && (
          <Home
            view={view}
            profile={profile}
            hero={hero}
            renderBlock={renderBlock}
            Section={Section}
          />
        )}
        {view.kind === 'work' && (
          <Work view={view} profile={profile} renderBlock={renderBlock} Section={Section} />
        )}
        {view.kind === 'project' && <ProjectArticle view={view} profile={profile} />}
        {view.kind === 'about' && (
          <About view={view} profile={profile} renderBlock={renderBlock} Section={Section} />
        )}
        {view.kind === 'contact' && <Contact view={view} profile={profile} />}
        {view.kind === 'custom' && (
          <Custom view={view} renderBlock={renderBlock} Section={Section} />
        )}
      </main>
      {footer}
    </ThemeWrapper>
  );
}
