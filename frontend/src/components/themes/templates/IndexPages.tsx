import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '../../ShareButton';
import { fill, translatorFor } from '@/lib/i18n';
import type { Block } from '../blocks';
import { AvailabilityBadge, NewTabLink } from '../parts';
import { aboutExtras } from '../sidebar/model';
import { heroSplit } from '../index/model';
import {
  AboutText,
  Facts,
  FormView,
  Hero,
  Intro,
  ContactBody,
  MoreWork,
  Photo,
  Section,
  WorkGrid,
  WorkingTogether,
  focusRing,
  grid2,
  gutter,
  labelClass,
  primaryButton,
  wrap,
  type Action,
} from '../index/parts';
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

// The pages of a multi-page portfolio in the Index theme. The rail is the navigation (drawn by the theme's
// nav); these are what sits beside it. IndexTheme passes in how a section is drawn.

type Render = (block: Block) => ReactNode;

const link = `underline decoration-1 underline-offset-4 hover:decoration-2 ${focusRing}`;
const bodyText = 'text-[1.0625rem] leading-[1.65]';

// A page's title: the large h1 on the left, the owner's line on the right.
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
    <header className={gutter}>
      <div className={`${grid2} pt-[clamp(3rem,8vw,7rem)] pb-[clamp(2.5rem,5vw,4.5rem)]`}>
        <div className="min-w-0">
          {kicker && (
            <p className="mb-3 text-[0.9375rem] text-muted [overflow-wrap:anywhere]">{kicker}</p>
          )}
          <h1
            className={`ix-tight text-[clamp(2.75rem,5.2vw,4.25rem)] leading-[1.08] font-medium text-balance outline-none ${wrap}`}
          >
            {title}
          </h1>
        </div>
        {intro && <p className={`${bodyText} max-w-[48ch] self-end ${wrap}`}>{intro}</p>}
      </div>
    </header>
  );
}

function Home({
  model,
  profile,
  idPrefix,
  render,
}: {
  model: HomeModel;
  profile: PublicProfile;
  idPrefix: string;
  render: Render;
}) {
  const ui = model.header.ui;
  const about = profile.sections.some((section) => section.key === 'about');
  const primary: Action | null = model.cta
    ? { href: model.cta.href, label: ui.sidebar.talk }
    : null;
  const secondary: Action | null = model.header.resume
    ? { href: model.header.resume.href, label: model.header.resume.label, download: true }
    : null;
  const pair = (label: string, value: ReactNode) => (
    <div className="min-w-0">
      <p className={labelClass}>{label}</p>
      <p className={`mt-1 ${bodyText} ${wrap}`}>{value}</p>
    </div>
  );
  return (
    <>
      <Hero
        header={model.header}
        id={`${idPrefix}intro`}
        line={about ? heroSplit(profile.about).line : null}
        primary={primary}
        secondary={secondary}
      />
      <Intro header={model.header} id={`${idPrefix}intro-title`} summary={null}>
        <div className="space-y-6">
          {model.now &&
            pair(
              ui.pages.now,
              fill(ui.pages.atCompany, { role: model.now.role, company: model.now.company }),
            )}
          {model.skills.length > 0 &&
            pair(
              ui.sections.skills,
              <>
                {model.skills.join(' · ')}
                {model.skillsTotal > model.skills.length &&
                  ` · ${fill(ui.pages.skillsMore, { count: model.skillsTotal - model.skills.length })}`}
              </>,
            )}
          {model.more && <MoreWork href={model.more.href} label={model.more.label} />}
        </div>
      </Intro>
      {model.cta ? (
        <Section id={`${idPrefix}home-contact`} title={model.cta.title}>
          <p className="max-w-[48ch] text-pretty">{model.cta.text}</p>
          <p className="mt-8">
            <Link href={model.cta.href} className={primaryButton}>
              {model.cta.label}
            </Link>
          </p>
        </Section>
      ) : (
        model.contact && render(model.contact)
      )}
    </>
  );
}

function Work({ model, render }: { model: WorkPageModel; render: Render }) {
  const { header } = model;
  const count = translatorFor(header.locale)('pages.projectCount', {
    count: model.projects.length,
  });
  return (
    <>
      <Title
        kicker={header.name}
        title={model.title}
        intro={model.intro ?? `${header.ui.pages.workIntro} · ${count}`}
      />
      {model.before.map((block) => render(block))}
      <section aria-label={model.title} className={gutter}>
        <div className="border-t border-line py-[clamp(2.5rem,6vw,5rem)]">
          <WorkGrid projects={model.projects} />
        </div>
      </section>
      {model.blocks.map((block) => render(block))}
    </>
  );
}

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
      className={`flex min-w-0 flex-col border-t border-line pt-5 hover:underline hover:underline-offset-4 ${end ? 'text-end' : ''} ${focusRing}`}
    >
      <span
        className={`flex items-center gap-1.5 text-[0.875rem] text-muted ${end ? 'justify-end' : ''}`}
      >
        {!end && <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
        {label}
        {end && <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
      </span>
      <span className={`mt-1 text-[1.25rem] leading-snug font-medium ${wrap}`}>
        {neighbour.name}
      </span>
    </Link>
  );
}

function Project({ model }: { model: ProjectPageModel }) {
  const ui = model.header.ui;
  return (
    <article className={gutter}>
      <div className="pt-[clamp(2rem,5vw,4rem)] pb-[clamp(3rem,7vw,6rem)]">
        <Breadcrumbs crumbs={model.crumbs} label={ui.pages.breadcrumbs} />
        <header className={`${grid2} pt-4`}>
          <div className="min-w-0">
            <p className="mb-3 text-[0.9375rem] text-muted">
              {ui.pages.caseStudy}
              {model.total > 1 && (
                <> · {fill(ui.pages.projectOf, { n: model.position, total: model.total })}</>
              )}
            </p>
            <h1
              className={`ix-tight text-[clamp(2.5rem,5vw,4rem)] leading-[1.08] font-medium text-balance outline-none ${wrap}`}
            >
              {model.name}
            </h1>
          </div>
          <div className="min-w-0 space-y-8">
            {model.description && (
              <p className={`${bodyText} max-w-[66ch] whitespace-pre-line ${wrap}`}>
                {model.description}
              </p>
            )}
            {model.tags.length > 0 && (
              <div>
                <p className={`${labelClass} mb-1`}>{ui.pages.tech}</p>
                <p aria-label={ui.pages.tech} className={`${bodyText} ${wrap}`}>
                  {model.tags.join(' · ')}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 print:hidden">
              {model.external && (
                <NewTabLink href={model.external} context={model.name} className={primaryButton}>
                  {ui.pages.visit}
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
                className="ix-share"
              />
            </div>
          </div>
        </header>
        {model.cover && (
          <img
            src={model.cover.src}
            alt={model.cover.alt || model.name}
            width={model.cover.width}
            height={model.cover.height}
            fetchPriority="high"
            decoding="async"
            className="mt-[clamp(2.5rem,5vw,4.5rem)] h-auto w-full print:break-inside-avoid"
          />
        )}
        {model.gallery.length > 0 && (
          <section aria-label={ui.pages.gallery} className="mt-[clamp(1.5rem,3vw,3rem)]">
            <ul className="grid gap-[clamp(1rem,2vw,2rem)] sm:grid-cols-2">
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
                    className="h-auto w-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        {(model.previous || model.next) && (
          <nav
            aria-label={ui.pages.otherProjects}
            className="mt-[clamp(3rem,6vw,5rem)] grid gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-6 sm:grid-cols-2 print:hidden"
          >
            {model.previous ? (
              <Neighbour neighbour={model.previous} label={ui.pages.previous} rel="prev" />
            ) : (
              <span />
            )}
            {model.next && (
              <Neighbour neighbour={model.next} label={ui.pages.next} rel="next" end />
            )}
          </nav>
        )}
        <p className="mt-10 print:hidden">
          <Link
            href={model.back.href}
            className={`inline-flex min-h-10 items-center gap-2 ${link}`}
          >
            <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            {fill(ui.pages.backTo, { page: model.back.label })}
          </Link>
        </p>
      </div>
    </article>
  );
}

function About({
  model,
  profile,
  render,
}: {
  model: AboutPageModel;
  profile: PublicProfile;
  render: Render;
}) {
  const { header } = model;
  const ui = header.ui;
  const facts = aboutExtras(profile, header).facts.filter(
    (fact) => !fact.href && fact.label !== ui.pages.factAvailability,
  );
  return (
    <>
      <Title kicker={header.name} title={model.title} />
      <div role="region" aria-labelledby="about-details" className={gutter}>
        <h2 id="about-details" className="sr-only">
          {ui.pages.aboutHeadline}
        </h2>
        <div className={`${grid2} border-t border-line py-[clamp(2.5rem,6vw,5rem)]`}>
          <div className="min-w-0">
            <Photo avatar={header.avatar} />
          </div>
          <div className="min-w-0 space-y-10">
            {model.text && <AboutText text={model.text} locale={header.locale} full />}
            <Facts facts={facts} label={ui.sidebar.facts} />
            {header.work && <WorkingTogether work={header.work} />}
            {model.resume && (
              <p className="print:hidden">
                <a href={model.resume.href} download className={link}>
                  {model.resume.label}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
      {model.blocks.map((block) => render(block))}
    </>
  );
}

function Contact({ model }: { model: ContactPageModel }) {
  const { header } = model;
  return (
    <>
      <Title kicker={header.name} title={model.title} />
      <section aria-label={model.title} className={gutter}>
        <div className={`${grid2} border-t border-line py-[clamp(2.5rem,6vw,5rem)]`}>
          <div className="min-w-0 space-y-6">
            <AvailabilityBadge
              availability={header.availability}
              ui={header.ui}
              className="text-[0.875rem] leading-snug text-ink"
              dotClassName="bg-accent-fg"
              linkClassName={`font-semibold ${link}`}
            />
            {header.resume && (
              <p className="print:hidden">
                <a href={header.resume.href} download className={link}>
                  {header.resume.label}
                </a>
              </p>
            )}
          </div>
          <ContactBody
            header={header}
            intro={model.form ? null : model.intro}
            form={
              model.form && model.state ? <FormView form={model.form} state={model.state} /> : null
            }
            work={model.work ? <WorkingTogether work={model.work} /> : null}
          />
        </div>
      </section>
    </>
  );
}

function Custom({ model, render }: { model: CustomPageModel; render: Render }) {
  return (
    <>
      <Title kicker={model.header.name} title={model.title} />
      {model.body && (
        <section aria-label={model.title} className={gutter}>
          <div className={`${grid2} border-t border-line py-[clamp(2.5rem,6vw,5rem)]`}>
            <div className="hidden min-[1280px]:block" />
            <div className={`${bodyText} max-w-[66ch] min-w-0 ${wrap}`}>
              <Markdown>{model.body}</Markdown>
            </div>
          </div>
        </section>
      )}
      {model.blocks.map((block) => render(block))}
    </>
  );
}

export function IndexPages({
  profile,
  view,
  idPrefix,
  renderBlock,
}: {
  profile: PublicProfile;
  view: PageView;
  idPrefix: string;
  renderBlock: Render;
}) {
  // A block is keyed by its own id wherever it is drawn.
  const render: Render = (block) => <div key={block.id}>{renderBlock(block)}</div>;
  return (
    <>
      {view.kind === 'home' && (
        <Home model={view} profile={profile} idPrefix={idPrefix} render={render} />
      )}
      {view.kind === 'work' && <Work model={view} render={render} />}
      {view.kind === 'project' && <Project model={view} />}
      {view.kind === 'about' && <About model={view} profile={profile} render={render} />}
      {view.kind === 'contact' && <Contact model={view} />}
      {view.kind === 'custom' && <Custom model={view} render={render} />}
    </>
  );
}
