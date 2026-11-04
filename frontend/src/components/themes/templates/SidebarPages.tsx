import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '../../ShareButton';
import { fill, translatorFor } from '@/lib/i18n';
import type { Block } from '../blocks';
import { AvailabilityBadge, Avatar, NewTabLink, ResumeLink, MoreLinkView } from '../parts';
import { ReadMore } from '../ReadMore';
import { aboutExtras } from '../sidebar/model';
import {
  Arrow,
  ContactSplit,
  DarkQuote,
  Facts,
  FormInBand,
  Hero,
  Stats,
  WorkList,
  WorkingTogether,
  focusRing,
  gutter,
  h2Class,
  outlineButton,
  primaryButton,
  textLink,
  wrap,
} from '../sidebar/parts';
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

// The pages of a multi-page portfolio in the Sidebar theme. The rail is the navigation (drawn by the
// theme's nav); these are what sits beside it. SidebarTheme passes in how a section is drawn.

type Render = (block: Block) => ReactNode;

// A page's title: the owner's name small above, the page's name large (the page's one h1).
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
    <header className={`${gutter} pt-12 pb-4 sm:pt-20`}>
      <div className="mx-auto max-w-5xl">
        {kicker && <p className="mb-3 text-base text-muted">{kicker}</p>}
        <h1
          className={`text-[clamp(2.4rem,7vw,5rem)] leading-[1.05] font-bold tracking-tight text-balance outline-none ${wrap}`}
        >
          {title}
        </h1>
        {intro && <p className={`mt-5 max-w-xl text-lg text-pretty text-muted ${wrap}`}>{intro}</p>}
      </div>
    </header>
  );
}

function Plain({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${gutter} py-16 sm:py-24`}>
      <div className="mx-auto max-w-5xl">
        <h2 id={id} tabIndex={-1} className={h2Class}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Home({ model, render, idPrefix }: { model: HomeModel; render: Render; idPrefix: string }) {
  const ui = model.header.ui;
  return (
    <>
      <Hero
        header={model.header}
        id={`${idPrefix}intro`}
        primary={model.cta ? { href: model.cta.href, label: ui.sidebar.talk } : null}
      />
      {model.now && (
        <p className={`${gutter} pb-4 text-base`}>
          <span className={`mx-auto block max-w-5xl ${wrap}`}>
            <span className="font-bold">{ui.pages.now}</span>
            {' · '}
            {fill(ui.pages.atCompany, { role: model.now.role, company: model.now.company })}
          </span>
        </p>
      )}
      {model.skills.length > 0 && (
        <p className={`${gutter} pb-4 text-base`}>
          <span className={`mx-auto block max-w-5xl text-muted ${wrap}`}>
            {model.skills.join(' · ')}
            {model.skillsTotal > model.skills.length &&
              ` · ${fill(ui.pages.skillsMore, { count: model.skillsTotal - model.skills.length })}`}
          </span>
        </p>
      )}
      {model.more && (
        <div className={`${gutter} pb-6`}>
          <div className="mx-auto max-w-5xl">
            <MoreLinkView more={model.more} className="mt-0" />
          </div>
        </div>
      )}
      {model.featured.length > 0 && (
        <Plain id={`${idPrefix}home-work`} title={ui.sections.projects}>
          <WorkList projects={model.featured} />
          {model.work && (
            <p className="mt-12">
              <Link href={model.work.href} className={`${outlineButton} sb-link gap-2`}>
                {model.work.label}
                <Arrow className="size-4" />
              </Link>
            </p>
          )}
        </Plain>
      )}
      {model.about && (
        <Plain id={`${idPrefix}home-about`} title={model.aboutTitle}>
          <ReadMore
            text={model.about.text}
            locale={model.header.locale}
            from={700}
            lines={7}
            className="text-lg leading-8 sm:text-xl sm:leading-9"
          />
          {model.about.href && (
            <p className="mt-6">
              <Link
                href={model.about.href}
                className={`sb-link inline-flex items-center gap-2 ${textLink}`}
              >
                {model.about.label}
                <Arrow className="size-4" />
              </Link>
            </p>
          )}
        </Plain>
      )}
      {model.writing && render(model.writing)}
      {model.cta ? (
        <section aria-labelledby={`${idPrefix}home-contact`} className={`${gutter} py-16 sm:py-24`}>
          <div className="sb-band mx-auto max-w-5xl p-8 sm:p-14">
            <h2 id={`${idPrefix}home-contact`} tabIndex={-1} className={`${h2Class} !mb-4`}>
              {model.cta.title}
            </h2>
            <p className="max-w-xl text-lg text-pretty">{model.cta.text}</p>
            <p className="mt-8">
              <Link
                href={model.cta.href}
                className={`sb-link inline-flex min-h-12 items-center gap-3 bg-[#111] px-7 py-3 text-sm font-semibold text-white hover:bg-black ${focusRing}`}
              >
                {model.cta.label}
                <Arrow />
              </Link>
            </p>
          </div>
        </section>
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
      <section aria-label={model.title} className={`${gutter} py-12 sm:py-16`}>
        <div className="mx-auto max-w-5xl">
          <WorkList projects={model.projects} />
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
      className={`flex min-w-0 flex-col border border-line p-5 hover:bg-accent-soft ${end ? 'text-end' : ''} ${focusRing}`}
    >
      <span className={`flex items-center gap-1.5 text-sm text-muted ${end ? 'justify-end' : ''}`}>
        {!end && <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
        {label}
        {end && <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
      </span>
      <span className={`mt-1 text-lg font-bold ${wrap}`}>{neighbour.name}</span>
    </Link>
  );
}

function Project({ model }: { model: ProjectPageModel }) {
  const ui = model.header.ui;
  return (
    <article className={`${gutter} py-10 sm:py-16`}>
      <div className="mx-auto max-w-4xl">
        <Breadcrumbs crumbs={model.crumbs} label={ui.pages.breadcrumbs} />
        <header>
          <p className="sb-it mb-3 text-base text-muted italic">
            {ui.pages.caseStudy}
            {model.total > 1 && (
              <> · {fill(ui.pages.projectOf, { n: model.position, total: model.total })}</>
            )}
          </p>
          <h1
            className={`text-[clamp(2.2rem,6.5vw,4.5rem)] leading-[1.05] font-bold tracking-tight text-balance ${wrap}`}
          >
            {model.name}
          </h1>
          {model.tags.length > 0 && (
            <ul aria-label={ui.pages.tech} className="mt-6 flex flex-wrap gap-2">
              {model.tags.map((tag) => (
                <li
                  key={tag}
                  className={`border border-line px-3 py-1 text-sm font-medium ${wrap}`}
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
            {model.external && (
              <NewTabLink href={model.external} context={model.name} className={primaryButton}>
                {ui.pages.visit}
                <ArrowUpRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
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
          <img
            src={model.cover.src}
            alt={model.cover.alt || model.name}
            width={model.cover.width}
            height={model.cover.height}
            fetchPriority="high"
            decoding="async"
            className="mt-12 h-auto w-full print:break-inside-avoid"
          />
        )}
        {model.description && (
          <p
            className={`mt-12 max-w-[62ch] text-lg leading-8 whitespace-pre-line sm:text-xl sm:leading-9 ${wrap}`}
          >
            {model.description}
          </p>
        )}
        {model.gallery.length > 0 && (
          <section aria-label={ui.pages.gallery} className="mt-14">
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
            className="mt-16 grid gap-4 sm:grid-cols-2 print:hidden"
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
            className={`inline-flex items-center gap-2 text-sm ${textLink}`}
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
  const extras = aboutExtras(profile, header);
  return (
    <>
      <Title kicker={ui.sidebar.welcome} title={model.title} />
      <section aria-label={ui.pages.aboutHeadline} className={`${gutter} py-12 sm:py-16`}>
        <div className="mx-auto grid max-w-5xl gap-12 min-[1100px]:grid-cols-[1.2fr_1fr] min-[1100px]:gap-16">
          <div className="min-w-0 space-y-10">
            {model.text && (
              <ReadMore
                text={model.text}
                locale={header.locale}
                from={1400}
                lines={14}
                className="text-lg leading-8 sm:text-xl sm:leading-9"
              />
            )}
            <Stats stats={extras.stats} />
          </div>
          <div className="min-w-0 space-y-8">
            <div className="w-40 sm:w-52">
              <Avatar
                avatar={header.avatar}
                className="aspect-square w-full rounded-full"
                placeholderClassName="bg-ink text-6xl font-bold text-page"
              />
            </div>
            <Facts facts={extras.facts} label={ui.sidebar.facts} />
            {header.work && <WorkingTogether work={header.work} />}
            {model.resume && (
              <ResumeLink resume={model.resume} className={`${outlineButton} print:hidden`} />
            )}
          </div>
        </div>
        {extras.quote && (
          <div className="mx-auto mt-14 max-w-5xl">
            <DarkQuote quote={extras.quote} label={ui.pages.kindWords} />
          </div>
        )}
      </section>
      {model.blocks.map((block) => render(block))}
    </>
  );
}

function Contact({ model, idPrefix }: { model: ContactPageModel; idPrefix: string }) {
  const { header } = model;
  return (
    <ContactSplit
      header={header}
      heading={model.title}
      id={`${idPrefix}contact-heading`}
      as="h1"
      form={model.form && model.state ? <FormInBand form={model.form} state={model.state} /> : null}
      extras={
        <div className="mt-10 space-y-6">
          {model.intro && <p className={`max-w-md text-lg text-pretty ${wrap}`}>{model.intro}</p>}
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="max-w-md border border-line px-4 py-3 text-sm text-ink"
            dotClassName="bg-accent"
            linkClassName={textLink}
          />
          {model.work && <WorkingTogether work={model.work} />}
          {header.resume && (
            <ResumeLink resume={header.resume} className={`${outlineButton} print:hidden`} />
          )}
        </div>
      }
    />
  );
}

function Custom({ model, render }: { model: CustomPageModel; render: Render }) {
  return (
    <>
      <Title kicker={model.header.name} title={model.title} />
      {model.body && (
        <div className={`${gutter} py-10`}>
          <div className={`mx-auto max-w-[62ch] text-lg leading-8 sm:text-xl sm:leading-9 ${wrap}`}>
            <Markdown>{model.body}</Markdown>
          </div>
        </div>
      )}
      {model.blocks.map((block) => render(block))}
    </>
  );
}

export function SidebarPages({
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
      {view.kind === 'home' && <Home model={view} render={render} idPrefix={idPrefix} />}
      {view.kind === 'work' && <Work model={view} render={render} />}
      {view.kind === 'project' && <Project model={view} />}
      {view.kind === 'about' && <About model={view} profile={profile} render={render} />}
      {view.kind === 'contact' && <Contact model={view} idPrefix={idPrefix} />}
      {view.kind === 'custom' && <Custom model={view} render={render} />}
    </>
  );
}
