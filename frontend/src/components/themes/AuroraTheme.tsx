import Link from 'next/link';
import { Manrope } from 'next/font/google';
import { pagePath, uiFor } from '@/lib/i18n';
import { isMulti, navItems } from '@/lib/pages';
import { languageLinks } from '@/lib/portfolio-links';
import { buildBlocks, buildFooter, buildHeader, type Block, type HeaderModel } from './blocks';
import { LeaveTestimonial } from './LeaveTestimonial';
import { ReadMore } from './ReadMore';
import { EmptyPage, MoreLinkView } from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import { AuroraBar } from './aurora/Bar';
import { Quotes } from './sidebar/Quotes';
import { bentoModel } from './aurora/model';
import {
  Bento,
  ContactSplit,
  CtaCard,
  Faq,
  FooterCard,
  FormOnCard,
  Hero,
  Roles,
  SkillList,
  Split,
  Studies,
  WorkStrip,
  Wide,
  Writing,
  bentoCount,
  gutter,
  column,
  secondaryButton,
} from './aurora/parts';
import { AuroraPages } from './templates/AuroraPages';
import { pageView } from './templates/model';
import type { ThemeProps } from './types';

// A calm dark portfolio: near-black surfaces with a little of the accent in them, raised cards one step
// lighter, and one soft glow of the accent behind the hero (and a faint one along the footer card). The
// signature is that glow with the bento grid of tiles right under it. Every color the accent decides is
// worked out and checked in lib/palette/recipes.ts, so text, buttons and rings read in any accent. Aurora is
// dark only (see PALETTES): the page does not follow the visitor's light mode. Manrope for everything;
// the script of a language that is not Latin brings its own Noto font (lib/locale-fonts).

const sans = Manrope({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = sans.className;

// One section of the single page or of a page of a multi-page portfolio.
function BlockView({ block, header }: { block: Block; header: HeaderModel }) {
  const ui = block.ui;
  const more = block.moreLink && <MoreLinkView more={block.moreLink} />;
  switch (block.kind) {
    case 'about':
      return (
        <Split block={block}>
          <ReadMore
            text={block.text}
            locale={block.locale}
            from={900}
            lines={9}
            className="pt-body text-ink"
          />
          {more}
        </Split>
      );
    case 'skills':
      return (
        <Split block={block}>
          <SkillList block={block} />
          {more}
        </Split>
      );
    case 'projects':
      return (
        <Wide
          block={block}
          action={
            block.moreLink && (
              <Link href={block.moreLink.href} className={secondaryButton}>
                {block.moreLink.label}
              </Link>
            )
          }
        >
          <WorkStrip
            projects={[...block.projects, ...block.rest]}
            label={block.title}
            labels={{
              prev: ui.aurora.workPrev,
              next: ui.aurora.workNext,
              visit: ui.pages.visit,
              tech: ui.pages.tech,
            }}
          />
        </Wide>
      );
    case 'writing':
      return (
        <Wide block={block}>
          <Writing block={block} />
        </Wide>
      );
    case 'testimonials': {
      const quotes = [...block.testimonials, ...block.rest];
      return (
        <Wide block={block}>
          <div className="au-card mx-auto max-w-3xl p-5 sm:p-8">
            {quotes.length > 0 && (
              <Quotes
                quotes={quotes}
                quoteClassName="pt-body font-normal"
                labels={{
                  prev: ui.sidebar.prev,
                  next: ui.sidebar.next,
                  position: ui.sidebar.position,
                }}
              />
            )}
            {block.submitTo && (
              <LeaveTestimonial
                slug={block.submitTo}
                ui={ui.leave}
                buttonClassName={`mt-8 ${secondaryButton}`}
              />
            )}
          </div>
        </Wide>
      );
    }
    case 'cta':
      return (
        <CtaCard
          id={block.id}
          title={block.title}
          text={block.text}
          href={block.href}
          label={block.label}
        />
      );
    case 'contact':
      return (
        <ContactSplit
          header={header}
          heading={block.title}
          id={block.id}
          form={<FormOnCard form={block.form} />}
        />
      );
    case 'entries':
      return (
        <Split block={block} lead={block.variant === 'experience'}>
          {block.variant === 'experience' ? (
            <Roles block={block} />
          ) : block.variant === 'education' ? (
            <Studies block={block} />
          ) : (
            <Faq block={block} />
          )}
        </Split>
      );
  }
}

export default function AuroraTheme({
  profile,
  idPrefix = '',
  page,
  nav,
  heading,
  lead,
  project,
  contact,
  appearance: appearanceProp,
}: ThemeProps) {
  const appearance = appearanceProp ?? profile.appearance;
  const header = buildHeader(profile);
  const ui = uiFor(profile.locale);
  const footerModel = buildFooter(profile);
  const root = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const items = isMulti(profile) ? navItems(profile) : [];
  const footer = (blocks: Block[]) => (
    <FooterCard
      footer={footerModel}
      header={header}
      nav={ui.pages.nav}
      links={
        items.length > 0
          ? items.map((item) => ({ href: item.href, label: item.label }))
          : blocks.slice(0, 7).map((block) => ({ href: `#${block.id}`, label: block.title }))
      }
    />
  );
  const shell = (bar: React.ReactNode, children: React.ReactNode, blocks: Block[]) => (
    <ThemeWrapper
      theme="aurora"
      profile={profile}
      className={fontClass}
      nav={bar}
      appearance={appearance}
    >
      <main id={`${idPrefix}main`} className="outline-none">
        {children}
      </main>
      {footer(blocks)}
    </ThemeWrapper>
  );

  // A multi-page portfolio's pages, and a project page in either mode.
  const view = pageView(profile, { page, project, contact });
  if (view) {
    const bar = nav ?? (
      <AuroraBar
        profile={profile}
        mode="pages"
        languages={languageLinks(profile)}
        items={[{ key: 'home', href: root, label: ui.sidebar.home }]}
      />
    );
    return shell(
      bar,
      <AuroraPages
        profile={profile}
        view={view}
        idPrefix={idPrefix}
        renderBlock={(block) => <BlockView block={block} header={header} />}
      />,
      [],
    );
  }

  // The single page.
  const blocks = buildBlocks(profile, idPrefix, page);
  const introId = `${idPrefix}intro`;
  const find = <K extends Block['kind']>(kind: K) =>
    blocks.find((block): block is Extract<Block, { kind: K }> => block.kind === kind);
  const contactBlock = find('contact');
  const skillsBlock = find('skills');
  const projectsBlock = find('projects');
  const bento = bentoModel(profile, header, {
    skills: skillsBlock ? `#${skillsBlock.id}` : null,
  });
  const bar = nav ?? (
    <AuroraBar
      profile={profile}
      mode="sections"
      languages={languageLinks(profile)}
      idPrefix={idPrefix}
      contactHref={contactBlock ? `#${contactBlock.id}` : null}
      items={[
        { key: 'intro', href: `#${introId}`, label: ui.sidebar.home },
        ...blocks.map((block) => ({ key: block.id, href: `#${block.id}`, label: block.title })),
      ]}
    />
  );
  const intro =
    lead ??
    (heading ? (
      <div className={`${gutter} pt-12 sm:pt-20`}>
        <div className={column}>
          <p className="pt-body mb-3 text-muted">{profile.fullName}</p>
          <h1 className="au-tight pt-title pt-name scroll-mt-24 font-bold">{heading}</h1>
        </div>
      </div>
    ) : (
      <>
        <Hero
          header={header}
          id={introId}
          primary={contactBlock ? { href: `#${contactBlock.id}`, label: ui.sidebar.talk } : null}
          secondary={
            projectsBlock ? { href: `#${projectsBlock.id}`, label: ui.sidebar.viewAllWork } : null
          }
        />
        {bentoCount(bento) >= 3 && <Bento model={bento} id={`${idPrefix}glance`} />}
      </>
    ));
  return shell(
    bar,
    <>
      {intro}
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} header={header} />
      ))}
      {blocks.length === 0 && !lead && (
        <EmptyPage text={ui.emptyPage} className={`${gutter} py-16 text-muted`} />
      )}
    </>,
    blocks,
  );
}
