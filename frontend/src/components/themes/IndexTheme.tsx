import type { ReactNode } from 'react';
import { Hedvig_Letters_Serif, Rethink_Sans } from 'next/font/google';
import type { PublicProfile } from '@parichay/shared';
import { fill, pagePath, uiFor } from '@/lib/i18n';
import { pageHref } from '@/lib/pages';
import { languageLinks } from '@/lib/portfolio-links';
import { buildBlocks, buildFooter, buildHeader, type Block, type HeaderModel } from './blocks';
import { LeaveTestimonial } from './LeaveTestimonial';
import { Collapse } from './Collapse';
import { EmptyPage } from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import { IndexRail } from './index/Rail';
import { IndexPages } from './templates/IndexPages';
import { pageView, rootOf } from './templates/model';
import { aboutExtras } from './sidebar/model';
import { introParts, numbering, pad } from './index/model';
import {
  AboutText,
  Contents,
  ContactBody,
  Facts,
  Footer,
  FormView,
  Hero,
  Intro,
  MoreWork,
  Photo,
  Quote,
  Roles,
  Ruled,
  Section,
  SkillsList,
  WorkGrid,
  WorkingTogether,
  WritingRuled,
  gutter,
  outlineButton,
  primaryButton,
  type Action,
} from './index/parts';
import type { ThemeProps } from './types';

// Index: a brand-guidelines page. A slim white rail on the left, one soft gradient in the hero, then a
// page of numbered sections: the large title on the left, the text in a narrow column on the right, hairline
// rules between and whitespace around. No cards, shadows, icons, chips or hover effects; the only motion is a
// short fade. The accent is for the numerals, small markers and links, and the gradient. Rethink Sans for
// everything, Hedvig Letters Serif for the one display moment (the name in the footer). The script of a
// language that is not Latin brings its own font (lib/locale-fonts), sized to the Latin x-height in
// app/theme-index.css. Light only: the page never follows the visitor's dark mode.

const sans = Rethink_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
});
const serif = Hedvig_Letters_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${serif.variable}`;

const WORK_SHOWN = 4;
const QUOTES_SHOWN = 3;

interface Ctx {
  profile: PublicProfile;
  header: HeaderModel;
  numbers: Map<string, string>;
  limitWork: boolean; // the single page and Home show four; a page of its own shows all
  worksIn: 'contact' | 'about' | 'intro' | null; // where the working-together card is
  summaryUsed: boolean; // the intro already shows the first part of About
}

// What the About section holds, from the About text and the owner's photo and facts. Null: nothing to show.
function aboutView(block: Extract<Block, { kind: 'about' }>, ctx: Ctx) {
  const { header, profile } = ctx;
  const text = ctx.summaryUsed ? introParts(block.text).rest : block.text;
  const facts = aboutExtras(profile, header).facts.filter(
    (fact) => !fact.href && fact.label !== header.ui.pages.factAvailability,
  );
  const photo = !!header.avatar.src;
  if (!text && !photo && facts.length === 0) return null;
  return { text, facts, photo };
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  const { header, profile } = ctx;
  const ui = block.ui;
  const number = ctx.numbers.get(block.id);
  const more = block.moreLink && (
    <MoreWork href={block.moreLink.href} label={block.moreLink.label} />
  );
  switch (block.kind) {
    case 'about': {
      const view = aboutView(block, ctx);
      if (!view) return null;
      return (
        <Section
          id={block.id}
          number={number}
          title={block.title}
          aside={view.photo ? <Photo avatar={header.avatar} /> : undefined}
        >
          <div className="space-y-10">
            {view.text && <AboutText text={view.text} locale={block.locale} />}
            <Facts facts={view.facts} label={ui.sidebar.facts} />
            {ctx.worksIn === 'about' && header.work && <WorkingTogether work={header.work} />}
            {view.photo && (
              <div className="min-[1280px]:hidden">
                <Photo avatar={header.avatar} />
              </div>
            )}
          </div>
          {more}
        </Section>
      );
    }
    case 'skills':
      return (
        <Section id={block.id} number={number} title={block.title}>
          <SkillsList block={block} />
          {more}
        </Section>
      );
    case 'projects': {
      const all = [...block.projects, ...block.rest];
      const shown = ctx.limitWork ? all.slice(0, WORK_SHOWN) : all;
      const link =
        block.moreLink ??
        (ctx.limitWork && all.length > WORK_SHOWN
          ? { href: `${rootOf(profile)}/work`, label: ui.density.viewAllProjects }
          : null);
      return (
        <Section id={block.id} number={number} title={block.title} layout="stack">
          <WorkGrid projects={shown} />
          {link && <MoreWork href={link.href} label={link.label} />}
        </Section>
      );
    }
    case 'writing':
      return (
        <Section id={block.id} number={number} title={block.title}>
          <WritingRuled block={block} />
        </Section>
      );
    case 'testimonials': {
      const all = [...block.testimonials, ...block.rest];
      return (
        <Section id={block.id} number={number} title={block.title}>
          <div className="space-y-6">
            {all.slice(0, QUOTES_SHOWN).map((quote) => (
              <Quote key={quote.id} quote={quote} />
            ))}
          </div>
          {all.length > QUOTES_SHOWN && (
            <Collapse
              className="mt-6"
              label={fill(ui.density.moreTestimonials, { count: all.length - QUOTES_SHOWN })}
              closeLabel={ui.density.showLess}
              buttonClassName="inline-flex min-h-10 items-center text-[1.0625rem] font-medium underline decoration-1 underline-offset-4 hover:decoration-2 print:hidden"
            >
              <div className="mt-6 space-y-6">
                {all.slice(QUOTES_SHOWN).map((quote) => (
                  <Quote key={quote.id} quote={quote} />
                ))}
              </div>
            </Collapse>
          )}
          {block.submitTo && (
            <div className="mt-8 print:hidden">
              <LeaveTestimonial
                slug={block.submitTo}
                ui={ui.leave}
                buttonClassName={outlineButton}
              />
            </div>
          )}
        </Section>
      );
    }
    case 'cta':
      return (
        <Section id={block.id} number={number} title={block.title}>
          <p className="max-w-[48ch] text-pretty">{block.text}</p>
          <p className="mt-8">
            <a href={block.href} className={primaryButton}>
              {block.label}
            </a>
          </p>
        </Section>
      );
    case 'contact':
      return (
        <Section id={block.id} number={number} title={block.title}>
          <ContactBody
            header={header}
            form={<FormView form={block.form} />}
            work={
              ctx.worksIn === 'contact' && header.work ? (
                <WorkingTogether work={header.work} />
              ) : null
            }
          />
        </Section>
      );
    case 'entries':
      if (block.variant === 'experience') {
        return (
          <Section id={block.id} number={number} title={block.title} layout="stack">
            <Roles block={block} />
          </Section>
        );
      }
      return (
        <Section id={block.id} number={number} title={block.title}>
          <Ruled block={block} />
        </Section>
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
    <ThemeWrapper theme="index" profile={profile} className={fontClass} nav={rail}>
      <main
        id={`${idPrefix}main`}
        tabIndex={-1}
        className="scroll-mt-14 outline-none min-[900px]:scroll-mt-0"
      >
        {children}
      </main>
      {footer}
    </ThemeWrapper>
  );
}

export default function IndexTheme({
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
  const ui = uiFor(profile.locale);
  const footerModel = buildFooter(profile);
  const visible = (key: string) => profile.sections.some((section) => section.key === key);
  const contactPage = profile.pages.find((item) => item.key === 'contact');
  const view = pageView(profile, { page, project, contact });

  if (view || heading || lead) {
    // A multi-page portfolio (or a project, or a titled page): the rail is the pages, and the page itself is
    // drawn by its template.
    const all = view ? buildBlocks(profile, idPrefix, page) : [];
    const numbers = numbering(all);
    const contactHref = contactPage ? pageHref(profile, contactPage) : null;
    const ctx: Ctx = {
      profile,
      header,
      numbers,
      limitWork: false,
      worksIn: null,
      summaryUsed: false,
    };
    const footer = (
      <Footer
        footer={footerModel}
        resume={header.resume}
        contactHref={contactHref}
        contactLabel={ui.sections.contact}
        backLabel={ui.index.backToTop}
        topHref={`#${idPrefix}main`}
      />
    );
    return (
      <Shell
        profile={profile}
        rail={
          nav ?? (
            <IndexRail
              profile={profile}
              mode="pages"
              items={[
                {
                  key: 'home',
                  href: pagePath(profile.slug, profile.locale, profile.defaultLocale),
                  label: ui.sidebar.home,
                },
              ]}
              languages={languageLinks(profile)}
            />
          )
        }
        footer={footer}
        idPrefix={idPrefix}
      >
        {view ? (
          <IndexPages
            profile={profile}
            view={view}
            idPrefix={idPrefix}
            renderBlock={(block) => <BlockView block={block} ctx={ctx} />}
          />
        ) : (
          (lead ?? (
            <header className={`${gutter} pt-[clamp(3rem,8vw,7rem)] pb-4`}>
              <p className="mb-3 text-[0.9375rem] text-muted">{profile.fullName}</p>
              <h1 className="ix-tight text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.08] font-medium text-balance outline-none [overflow-wrap:anywhere]">
                {heading}
              </h1>
            </header>
          ))
        )}
      </Shell>
    );
  }

  // ---- The single page: hero, intro, contents, then the sections in the owner's order.
  const blocks = buildBlocks(profile, idPrefix, page);
  const aboutBlock = blocks.find(
    (block): block is Extract<Block, { kind: 'about' }> => block.kind === 'about',
  );
  const contactBlock = blocks.find((block) => block.kind === 'contact');
  const ctx: Ctx = {
    profile,
    header,
    numbers: new Map(),
    limitWork: true,
    worksIn: contactBlock ? 'contact' : aboutBlock ? 'about' : 'intro',
    summaryUsed: !!aboutBlock,
  };
  // About leaves the page when the intro already says all of it and there is no photo or fact to add.
  const shown = blocks.filter((block) => block.kind !== 'about' || aboutView(block, ctx) !== null);
  // The Contact section is shown even without the form when the owner has contact links and has not hidden it.
  const hasDetails = header.links.length > 0;
  const extraContact =
    !contactBlock && visible('contact') && hasDetails
      ? {
          id: `${idPrefix}contact`,
          title:
            profile.sections.find((section) => section.key === 'contact')?.title ??
            ui.sections.contact,
        }
      : null;
  const entries = [
    ...shown.map((block) => ({ id: block.id, title: block.title })),
    ...(extraContact ? [extraContact] : []),
  ];
  ctx.numbers = new Map(entries.map((entry, index) => [entry.id, pad(index + 1)]));
  const contactId = contactBlock?.id ?? extraContact?.id ?? null;
  const email = header.links.find((link) => link.type === 'email');
  const primary: Action | null = contactId
    ? { href: `#${contactId}`, label: ui.sidebar.talk }
    : email
      ? { href: email.href, label: ui.sidebar.talk }
      : null;
  const first = entries[0];
  const secondary: Action | null = header.resume
    ? { href: header.resume.href, label: header.resume.label, download: true }
    : first && first.id !== contactId
      ? { href: `#${first.id}`, label: first.title }
      : null;
  const introId = `${idPrefix}intro`;
  const intro = introParts(aboutBlock?.text);
  const summary = intro.summary;
  const items = entries.map((entry) => ({
    key: entry.id,
    href: `#${entry.id}`,
    label: entry.title,
  }));
  const rail = nav ?? (
    <IndexRail
      profile={profile}
      mode="sections"
      idPrefix={idPrefix}
      items={items}
      languages={languageLinks(profile)}
      contactHref={contactId ? `#${contactId}` : null}
    />
  );
  const footer = (
    <Footer
      footer={footerModel}
      resume={header.resume}
      contactHref={contactId ? `#${contactId}` : null}
      contactLabel={ui.sections.contact}
      backLabel={ui.index.backToTop}
      topHref={`#${idPrefix}main`}
    />
  );
  return (
    <Shell profile={profile} rail={rail} footer={footer} idPrefix={idPrefix}>
      <Hero
        header={header}
        id={introId}
        line={intro.line}
        primary={primary}
        secondary={secondary}
      />
      <Intro header={header} id={`${idPrefix}intro-title`} summary={summary || null}>
        {ctx.worksIn === 'intro' && header.work && <WorkingTogether work={header.work} />}
      </Intro>
      <Contents
        label={ui.index.contents}
        items={entries.map((entry) => ({
          href: `#${entry.id}`,
          label: entry.title,
          number: ctx.numbers.get(entry.id) ?? '',
        }))}
      />
      {shown.map((block) => (
        <BlockView key={block.id} block={block} ctx={ctx} />
      ))}
      {extraContact && (
        <Section
          id={extraContact.id}
          number={ctx.numbers.get(extraContact.id)}
          title={extraContact.title}
        >
          <ContactBody
            header={header}
            form={null}
            work={header.work ? <WorkingTogether work={header.work} /> : null}
          />
        </Section>
      )}
      {entries.length === 0 && (
        <EmptyPage
          text={ui.emptyPage}
          className={`${gutter} border-t border-line py-16 text-muted`}
        />
      )}
    </Shell>
  );
}
