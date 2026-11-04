import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { PublicProfile } from '@parichay/shared';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '../../ShareButton';
import { fill, translatorFor } from '@/lib/i18n';
import { findPage, pageHref } from '@/lib/pages';
import type { Block } from '../blocks';
import { AvailabilityBadge, Avatar, NewTabLink, ResumeLink, MoreLinkView } from '../parts';
import { ReadMore } from '../ReadMore';
import { bentoModel } from '../aurora/model';
import {
  Arrow,
  Bento,
  ContactSplit,
  CtaCard,
  FormOnCard,
  Hero,
  WorkGrid,
  WorkStrip,
  WorkingTogether,
  Wide,
  bentoCount,
  column,
  display,
  focusRing,
  gutter,
  primaryButton,
  secondaryButton,
  textLink,
  wrap,
} from '../aurora/parts';
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

// The pages of a multi-page portfolio in the Aurora theme. The slim bar is the navigation (drawn by the
// theme's nav); these are what sits under it. AuroraTheme passes in how a section is drawn.

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
      <div className={column}>
        {kicker && <p className="mb-3 pt-body text-muted">{kicker}</p>}
        <h1
          className={`${display} scroll-mt-24 text-[clamp(2.2rem,6vw,4rem)] leading-[1.05] outline-none ${wrap}`}
        >
          {title}
        </h1>
        {intro && <p className={`mt-5 max-w-xl pt-body text-pretty text-muted ${wrap}`}>{intro}</p>}
      </div>
    </header>
  );
}

function Home({
  model,
  profile,
  idPrefix,
}: {
  model: HomeModel;
  profile: PublicProfile;
  idPrefix: string;
}) {
  const ui = model.header.ui;
  const aboutPage = findPage(profile, 'about');
  const aboutHref = aboutPage ? pageHref(profile, aboutPage) : null;
  const bento = bentoModel(profile, model.header, { skills: aboutHref });
  return (
    <>
      <Hero
        header={model.header}
        id={`${idPrefix}intro`}
        primary={model.cta ? { href: model.cta.href, label: ui.sidebar.talk } : null}
        secondary={model.work ? { href: model.work.href, label: model.work.label } : null}
      />
      {bentoCount(bento) >= 3 && <Bento model={bento} id={`${idPrefix}glance`} />}
      {model.featured.length > 0 && (
        <Wide
          block={{ id: `${idPrefix}home-work`, title: ui.sections.projects }}
          action={
            model.work && (
              <Link href={model.work.href} className={secondaryButton}>
                {model.work.label}
                <Arrow />
              </Link>
            )
          }
        >
          <WorkStrip
            projects={model.featured}
            label={ui.sections.projects}
            labels={{
              prev: ui.aurora.workPrev,
              next: ui.aurora.workNext,
              visit: ui.pages.visit,
              tech: ui.pages.tech,
            }}
          />
        </Wide>
      )}
      {model.more && (
        <div className={`${gutter} pb-6`}>
          <div className={column}>
            <MoreLinkView more={model.more} className="mt-0" />
          </div>
        </div>
      )}
      {model.cta ? (
        <CtaCard
          id={`${idPrefix}home-contact`}
          title={model.cta.title}
          text={model.cta.text}
          href={model.cta.href}
          label={model.cta.label}
        />
      ) : (
        model.contact && (
          <ContactSplit
            header={model.header}
            heading={model.contact.title}
            id={model.contact.id}
            form={<FormOnCard form={model.contact.form} />}
          />
        )
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
      <section aria-label={model.title} className={`${gutter} py-10 sm:py-14`}>
        <div className={column}>
          <WorkGrid
            projects={model.projects}
            visit={header.ui.pages.visit}
            tech={header.ui.pages.tech}
          />
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
      className={`au-card au-lift flex min-w-0 flex-col p-5 ${end ? 'text-end' : ''} ${focusRing}`}
    >
      <span className={`flex items-center gap-1.5 pt-small text-muted ${end ? 'justify-end' : ''}`}>
        {!end && <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
        {label}
        {end && <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />}
      </span>
      <span className={`mt-1 pt-body font-semibold ${wrap}`}>{neighbour.name}</span>
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
          <p className="mb-3 pt-body text-muted">
            {ui.pages.caseStudy}
            {model.total > 1 && (
              <> · {fill(ui.pages.projectOf, { n: model.position, total: model.total })}</>
            )}
          </p>
          <h1
            className={`${display} scroll-mt-24 text-[clamp(2.2rem,6vw,4rem)] leading-[1.05] outline-none ${wrap}`}
          >
            {model.name}
          </h1>
          {model.tags.length > 0 && (
            <ul aria-label={ui.pages.tech} className="mt-6 flex flex-wrap gap-2">
              {model.tags.map((tag) => (
                <li
                  key={tag}
                  className={`rounded-full border border-line px-3 py-1 pt-small ${wrap}`}
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
            className="mt-10 h-auto w-full rounded-2xl print:break-inside-avoid"
          />
        )}
        {model.description && (
          <p className={`mt-10 max-w-[62ch] pt-body whitespace-pre-line text-ink ${wrap}`}>
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
                    className="h-auto w-full rounded-2xl"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        {(model.previous || model.next) && (
          <nav
            aria-label={ui.pages.otherProjects}
            className="mt-14 grid gap-4 sm:grid-cols-2 print:hidden"
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
            className={`inline-flex items-center gap-2 pt-small ${textLink}`}
          >
            <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            {fill(ui.pages.backTo, { page: model.back.label })}
          </Link>
        </p>
      </div>
    </article>
  );
}

function About({ model, render }: { model: AboutPageModel; render: Render }) {
  const { header } = model;
  const ui = header.ui;
  return (
    <>
      <Title kicker={header.name} title={model.title} />
      <section aria-label={ui.pages.aboutHeadline} className={`${gutter} py-10 sm:py-14`}>
        <div
          className={`${column} grid gap-10 min-[1000px]:grid-cols-[1.4fr_1fr] min-[1000px]:gap-14`}
        >
          <div className="min-w-0">
            {model.text && (
              <ReadMore
                text={model.text}
                locale={header.locale}
                from={1400}
                lines={14}
                className="pt-body text-ink "
              />
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <div className="au-card p-5">
              <Avatar
                avatar={header.avatar}
                className="aspect-square w-32 rounded-3xl"
                placeholderClassName="bg-accent-soft text-5xl font-bold text-accent-fg"
              />
              {model.facts.length > 0 && (
                <dl className="mt-5 space-y-3">
                  {model.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="pt-small text-muted">{fact.label}</dt>
                      <dd className={`font-semibold ${wrap}`}>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {header.availability && (
              <div className="au-card p-5">
                <AvailabilityBadge
                  availability={header.availability}
                  ui={ui}
                  className="flex-col pt-small text-ink"
                  dotClassName="bg-accent"
                  linkClassName={textLink}
                />
              </div>
            )}
            {header.work && <WorkingTogether work={header.work} />}
            {model.resume && (
              <ResumeLink resume={model.resume} className={`${secondaryButton} print:hidden`} />
            )}
          </div>
        </div>
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
      form={model.form && model.state ? <FormOnCard form={model.form} state={model.state} /> : null}
      extras={
        <div className="mt-8 space-y-5">
          {model.intro && (
            <p className={`max-w-md pt-body text-pretty text-muted ${wrap}`}>{model.intro}</p>
          )}
          {header.availability && (
            <div className="au-card max-w-md p-5">
              <AvailabilityBadge
                availability={header.availability}
                ui={header.ui}
                className="pt-small text-ink"
                dotClassName="bg-accent"
                linkClassName={textLink}
              />
            </div>
          )}
          {model.work && <WorkingTogether work={model.work} />}
          {header.resume && (
            <ResumeLink resume={header.resume} className={`${secondaryButton} print:hidden`} />
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
        <div className={`${gutter} py-8`}>
          <div className={`${column}`}>
            <div className={`max-w-[62ch] pt-body ${wrap}`}>
              <Markdown>{model.body}</Markdown>
            </div>
          </div>
        </div>
      )}
      {model.blocks.map((block) => render(block))}
    </>
  );
}

export function AuroraPages({
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
      {view.kind === 'home' && <Home model={view} profile={profile} idPrefix={idPrefix} />}
      {view.kind === 'work' && <Work model={view} render={render} />}
      {view.kind === 'project' && <Project model={view} />}
      {view.kind === 'about' && <About model={view} render={render} />}
      {view.kind === 'contact' && <Contact model={view} idPrefix={idPrefix} />}
      {view.kind === 'custom' && <Custom model={view} render={render} />}
    </>
  );
}
