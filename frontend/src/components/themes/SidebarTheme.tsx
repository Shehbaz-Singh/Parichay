import type { ReactNode } from 'react';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import { fill, pagePath, uiFor } from '@/lib/i18n';
import {
  buildBlocks,
  buildFooter,
  buildHeader,
  type Block,
  type FooterModel,
  type HeaderModel,
} from './blocks';
import { Expander } from './kit';
import { Quotes } from './sidebar/Quotes';
import { LeaveTestimonial } from './LeaveTestimonial';
import { ReadMore } from './ReadMore';
import { EmptyPage, MoreLinkView } from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import { Rail } from './sidebar/Rail';
import { SidebarPages } from './templates/SidebarPages';
import { pageView } from './templates/model';
import { aboutExtras } from './sidebar/model';
import {
  Accordion,
  ContactSplit,
  DarkQuote,
  Facts,
  FormInBand,
  Frame,
  Hero,
  Projects,
  Roles,
  Stats,
  outlineButton,
  Studies,
  Writing,
  WorkingTogether,
  focusRing,
  gutter,
  h2Class,
  wrap,
} from './sidebar/parts';
import type { ThemeProps } from './types';

// A dark rail beside a wide, airy page. The rail holds the name (a serif logotype), the navigation, the
// social icons and a quiet last line; the page beside it is near-white with the accent used for shapes,
// two gradient bands (experience and contact) and links. The signature is the rail with the oversized
// mixed-weight introduction. Everything the accent decides is checked in lib/palette/recipes.ts, so white
// text on the rail and on the bands reads in any color. IBM Plex Sans for text, Source Serif 4 for the
// logotype only; the script of a language that is not Latin brings its own font (lib/locale-fonts).

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${serif.variable}`;

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className={`${gutter} pt-8 pb-12 pt-small text-muted`}>
      <div className="mx-auto max-w-5xl border-t border-line pt-6">
        <p>
          Made {footer.message}{' '}
          <a
            href={footer.cta.href}
            className={`font-bold text-ink underline underline-offset-4 hover:no-underline ${focusRing}`}
          >
            {footer.cta.label}
          </a>
        </p>
      </div>
    </footer>
  );
}

// One section of the single page or of a page of a multi-page portfolio.
function BlockView({
  block,
  header,
  profile,
}: {
  block: Block;
  header: HeaderModel;
  profile: ThemeProps['profile'];
}) {
  const ui = block.ui;
  const more = block.moreLink && <MoreLinkView more={block.moreLink} />;
  switch (block.kind) {
    case 'about': {
      const extras = aboutExtras(profile, header);
      return (
        <Frame block={block} kicker={ui.sidebar.welcome}>
          <div className="grid gap-12 min-[1100px]:grid-cols-[1.2fr_1fr] min-[1100px]:gap-16">
            <div className="min-w-0 space-y-10">
              <ReadMore
                text={block.text}
                locale={block.locale}
                from={900}
                lines={9}
                className="pt-body "
              />
              <Stats stats={extras.stats} />
            </div>
            <div className="min-w-0 space-y-8">
              <Facts facts={extras.facts} label={ui.sidebar.facts} />
              {header.work && <WorkingTogether work={header.work} />}
            </div>
          </div>
          {extras.quote && (
            <div className="mt-14">
              <DarkQuote quote={extras.quote} label={ui.pages.kindWords} />
            </div>
          )}
          {more}
        </Frame>
      );
    }
    case 'skills': {
      const list = (items: typeof block.skills) => (
        <ul className="flex flex-wrap gap-3">
          {items.map((skill) => (
            <li
              key={skill.id}
              className={`border border-line px-4 py-2 pt-small font-bold ${wrap}`}
            >
              {skill.name}
            </li>
          ))}
        </ul>
      );
      return (
        <Frame block={block}>
          {list(block.skills)}
          {block.rest.length > 0 && (
            <Expander
              className="mt-8"
              label={fill(ui.density.moreSkills, { count: block.rest.length })}
              closeLabel={ui.density.showLess}
            >
              <div className="mt-6">{list(block.rest)}</div>
            </Expander>
          )}
          {more}
        </Frame>
      );
    }
    case 'projects':
      return (
        <Frame block={block}>
          <Projects block={block} />
          {more}
        </Frame>
      );
    case 'writing':
      return (
        <Frame block={block}>
          <Writing block={block} />
        </Frame>
      );
    case 'testimonials': {
      const list = (items: typeof block.testimonials) => (
        <ul className="space-y-10">
          {items.map((quote) => (
            <li key={quote.id} className="min-w-0">
              <figure className="border-s-4 border-accent ps-6">
                <blockquote className={`pt-h3 pt-measure font-normal whitespace-pre-line ${wrap}`}>
                  {quote.message}
                </blockquote>
                <figcaption className="pt-small mt-4">
                  <span className="font-bold">{quote.name}</span>
                  {quote.detail && <span className="block text-muted">{quote.detail}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      );
      const all = [...block.testimonials, ...block.rest];
      // The owner may choose a carousel (two labeled buttons, nothing advances by itself).
      const carousel = profile.testimonialStyle === 'carousel' && all.length > 1;
      return (
        <Frame block={block}>
          {carousel && (
            <Quotes
              quotes={all}
              labels={{
                prev: ui.sidebar.prev,
                next: ui.sidebar.next,
                position: ui.sidebar.position,
              }}
            />
          )}
          {!carousel && all.length > 0 && list(all.slice(0, 3))}
          {!carousel && all.length > 3 && (
            <Expander
              className="mt-10"
              label={fill(ui.density.moreTestimonials, { count: all.length - 3 })}
              closeLabel={ui.density.showLess}
            >
              <div className="mt-10">{list(all.slice(3))}</div>
            </Expander>
          )}
          {block.submitTo && (
            <div className="mt-10 print:hidden">
              <LeaveTestimonial
                slug={block.submitTo}
                ui={ui.leave}
                buttonClassName={outlineButton}
              />
            </div>
          )}
        </Frame>
      );
    }
    case 'cta':
      return (
        <section aria-labelledby={block.id} className={`${gutter} py-16 sm:py-24`}>
          <div className="sb-band mx-auto max-w-5xl p-8 sm:p-14">
            <h2 id={block.id} tabIndex={-1} className={`${h2Class} !mb-4`}>
              {block.title}
            </h2>
            <p className="max-w-xl pt-body text-pretty">{block.text}</p>
            <p className="mt-8">
              <a
                href={block.href}
                className={`inline-flex min-h-12 items-center bg-[#111] px-7 py-3 pt-small font-bold text-white hover:bg-black ${focusRing}`}
              >
                {block.label}
              </a>
            </p>
          </div>
        </section>
      );
    case 'contact':
      return (
        <ContactSplit
          header={header}
          heading={block.title}
          id={block.id}
          form={<FormInBand form={block.form} />}
        />
      );
    case 'entries':
      if (block.variant === 'experience') {
        return (
          <Frame block={block} band>
            <Roles block={block} />
          </Frame>
        );
      }
      return (
        <Frame block={block}>
          {block.variant === 'education' ? <Studies block={block} /> : <Accordion block={block} />}
        </Frame>
      );
  }
}

function Shell({
  profile,
  rail,
  children,
  footer,
  idPrefix,
}: {
  profile: ThemeProps['profile'];
  rail: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  idPrefix: string;
}) {
  // The wrapper puts the rail (its `nav`) and the page in one row from 900px up.
  return (
    <ThemeWrapper theme="sidebar" profile={profile} className={fontClass} nav={rail}>
      <main id={`${idPrefix}main`} className="outline-none">
        {children}
      </main>
      {footer}
    </ThemeWrapper>
  );
}

export default function SidebarTheme({
  profile,
  idPrefix = '',
  page,
  nav,
  heading,
  lead,
  project,
  contact,
}: ThemeProps) {
  const header = buildHeader(profile);
  const footer = <Footer footer={buildFooter(profile)} />;
  // In a multi-page portfolio the navigation (the rail, drawn by the theme's nav) comes in as `nav`; on the
  // single page the rail links to the sections.
  const view = pageView(profile, { page, project, contact });
  if (view) {
    return (
      <Shell
        profile={profile}
        // A project page of a single-page portfolio has no navigation: the rail then only leads home.
        rail={
          nav ?? (
            <Rail
              profile={profile}
              mode="pages"
              items={[
                {
                  key: 'home',
                  href: pagePath(profile.slug, profile.locale, profile.defaultLocale),
                  label: uiFor(profile.locale).sidebar.home,
                },
              ]}
            />
          )
        }
        footer={footer}
        idPrefix={idPrefix}
      >
        <SidebarPages
          profile={profile}
          view={view}
          idPrefix={idPrefix}
          renderBlock={(block) => <BlockView block={block} header={header} profile={profile} />}
        />
      </Shell>
    );
  }
  const blocks = buildBlocks(profile, idPrefix, page);
  const ui = uiFor(profile.locale);
  const introId = `${idPrefix}intro`;
  const contactBlock = blocks.find((block) => block.kind === 'contact');
  const rail = nav ?? (
    <Rail
      profile={profile}
      mode="sections"
      idPrefix={idPrefix}
      items={[
        { key: 'intro', href: `#${introId}`, label: ui.sidebar.home },
        ...blocks.map((block) => ({ key: block.id, href: `#${block.id}`, label: block.title })),
      ]}
    />
  );
  return (
    <Shell profile={profile} rail={rail} footer={footer} idPrefix={idPrefix}>
      {lead ??
        (heading ? (
          <div className={`${gutter} pt-12 sm:pt-20`}>
            <div className="mx-auto max-w-5xl">
              <p className="pt-body mb-3 text-muted">{profile.fullName}</p>
              <h1 className={`${h2Class} pt-title pt-name`}>{heading}</h1>
            </div>
          </div>
        ) : (
          <Hero
            header={header}
            id={introId}
            primary={contactBlock ? { href: `#${contactBlock.id}`, label: ui.sidebar.talk } : null}
          />
        ))}
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} header={header} profile={profile} />
      ))}
      {blocks.length === 0 && !lead && (
        <EmptyPage text={ui.emptyPage} className={`${gutter} py-16 text-muted`} />
      )}
    </Shell>
  );
}
