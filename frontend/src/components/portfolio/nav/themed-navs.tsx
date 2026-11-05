import Link from 'next/link';
import type { ComponentType } from 'react';
import type { PublicProfile, ThemeKey } from '@parichay/shared';
import type { Ui } from '@/lib/i18n';
import type { NavItem } from '@/lib/pages';
import { LanguageSwitcher, type LanguageLink } from '../LanguageSwitcher';
import { ReadingPreferences } from '../ReadingPreferences';
import { Rail } from '../../themes/sidebar/Rail';
import { AuroraBar } from '../../themes/aurora/Bar';
import { IndexRail } from '../../themes/index/Rail';
import { MobileBar, type MobileStyles } from './MobileBar';

// The navigation of a multi-page portfolio, once for each theme: the same pages in the same order, drawn
// the way that theme draws everything else. From `sm` up it is the design below; on a phone every theme
// uses the bottom bar and the full-screen menu of MobileBar, dressed in its own classes. Each marks the
// current page with aria-current and a shape or a rule (never color alone), and holds the language links
// and the reading preferences. They sit inside the theme's wrapper, so its colors and fonts apply.

export interface NavProps {
  profile: PublicProfile;
  items: NavItem[];
  current: string;
  languages: LanguageLink[];
  ui: Ui;
}

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const display = 'font-(family-name:--font-theme-display)';

// The language links and the reading preferences, in the navigation (or at the end of the phone menu).
function Utilities({
  profile,
  languages,
  ui,
  buttonClassName,
}: Pick<NavProps, 'profile' | 'languages' | 'ui'> & { buttonClassName: string }) {
  return (
    <>
      {languages.length > 1 && (
        <LanguageSwitcher
          links={languages}
          current={profile.locale}
          label={ui.switcher.label}
          inNav
        />
      )}
      <ReadingPreferences ui={ui.reading} triggerClassName={buttonClassName} />
    </>
  );
}

const mobileText = (ui: Ui) => ({
  nav: ui.pages.nav,
  more: ui.pages.menu,
  menuTitle: ui.pages.menuTitle,
  close: ui.pages.closeMenu,
});

const homeOf = (items: NavItem[]) => items[0]?.href ?? '/';

const BASE_BAR_ITEM = `flex h-14 min-w-0 items-center justify-center px-1 text-center text-sm ${focusRing} focus-visible:-outline-offset-4`;
const BASE_CLOSE = `inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold ${focusRing}`;

// ---- Editorial: a masthead. The name set like a newspaper's, between rules, and the pages as a row of
// small capitals beneath it; the current one is underlined. It scrolls away with the page.
const editorialMobile: MobileStyles = {
  bar: 'border-t border-ink bg-page text-ink',
  item: `${BASE_BAR_ITEM} text-xs tracking-[0.1em] uppercase`,
  current: 'font-bold shadow-[inset_0_4px_0_0_currentColor]',
  sheet: 'bg-page text-ink',
  sheetLink: `${display} block border-b border-line py-4 text-3xl font-medium ${focusRing}`,
  sheetCurrent: 'underline decoration-2 underline-offset-8',
  close: `${BASE_CLOSE} border border-ink`,
};

function EditorialNav({ profile, items, current, languages, ui }: NavProps) {
  const button =
    'inline-flex items-center gap-1.5 text-xs underline underline-offset-4 hover:no-underline ' +
    focusRing;
  const utilities = (
    <Utilities profile={profile} languages={languages} ui={ui} buttonClassName={button} />
  );
  return (
    <>
      <header
        data-sitenav=""
        className="hidden border-b border-ink px-5 text-ink sm:block sm:px-8 lg:px-[clamp(3rem,6vw,8rem)] print:hidden"
      >
        <div className="mx-auto max-w-[110rem]">
          <div className="flex flex-wrap items-center justify-end gap-x-3 pt-3 text-xs">
            {utilities}
          </div>
          <p className="pt-1 pb-3 text-center">
            <Link
              href={homeOf(items)}
              className={`${display} text-3xl font-medium tracking-tight ${focusRing}`}
            >
              {profile.fullName}
            </Link>
          </p>
          <nav aria-label={ui.pages.nav} className="border-y border-ink py-2">
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-1 text-sm tracking-[0.12em] uppercase">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={item.key === current ? 'page' : undefined}
                    className={`inline-block py-1 underline-offset-8 hover:underline aria-[current=page]:font-bold aria-[current=page]:underline aria-[current=page]:decoration-2 ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <MobileBar items={items} current={current} text={mobileText(ui)} styles={editorialMobile}>
        {utilities}
      </MobileBar>
    </>
  );
}

// ---- Bento: a floating dock of rounded tiles. The current page is the filled tile.
const bentoMobile: MobileStyles = {
  bar: 'border-t border-line bg-surface text-ink',
  item: `${BASE_BAR_ITEM} font-semibold`,
  current: 'bg-ink text-page',
  sheet: 'bg-page text-ink',
  sheetLink: `block rounded-2xl border border-line bg-surface px-5 py-4 text-xl font-bold ${focusRing}`,
  sheetCurrent: 'bg-ink text-page',
  close: `${BASE_CLOSE} rounded-full border border-line bg-surface`,
};

function BentoNav({ profile, items, current, languages, ui }: NavProps) {
  const button = `inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold hover:bg-page ${focusRing}`;
  const utilities = (
    <Utilities profile={profile} languages={languages} ui={ui} buttonClassName={button} />
  );
  return (
    <>
      <header
        data-sitenav=""
        className="sticky top-0 z-30 hidden px-4 pt-3 text-ink sm:block print:hidden"
      >
        <div className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-line fx-blur-surface p-1.5 shadow-raised">
          <nav aria-label={ui.pages.nav}>
            <ul className="flex flex-wrap gap-1">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={item.key === current ? 'page' : undefined}
                    className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold hover:bg-page aria-[current=page]:bg-ink aria-[current=page]:text-page ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
          <div className="flex items-center gap-1 pe-1 text-sm">{utilities}</div>
        </div>
      </header>
      <MobileBar items={items} current={current} text={mobileText(ui)} styles={bentoMobile}>
        {utilities}
      </MobileBar>
    </>
  );
}

// ---- Soft: a calm, rounded row with a dot in front of the current page.
const softMobile: MobileStyles = {
  bar: 'border-t border-line fx-blur text-ink',
  item: `${BASE_BAR_ITEM} font-semibold`,
  current: 'bg-accent-soft font-bold',
  sheet: 'bg-page text-ink',
  sheetLink: `${display} block rounded-3xl px-5 py-4 text-2xl font-medium ${focusRing}`,
  sheetCurrent: 'bg-accent-soft font-bold',
  close: `${BASE_CLOSE} rounded-full border border-line bg-surface`,
};

function SoftNav({ profile, items, current, languages, ui }: NavProps) {
  const button = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-accent-soft ${focusRing}`;
  const utilities = (
    <Utilities profile={profile} languages={languages} ui={ui} buttonClassName={button} />
  );
  return (
    <>
      <header data-sitenav="" className="hidden px-8 pt-6 text-ink sm:block print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-line bg-surface px-3 py-1.5">
          <nav aria-label={ui.pages.nav}>
            <ul className="flex flex-wrap gap-1">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={item.key === current ? 'page' : undefined}
                    className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold hover:bg-accent-soft aria-[current=page]:bg-accent-soft aria-[current=page]:font-bold aria-[current=page]:before:me-2 aria-[current=page]:before:size-1.5 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-current ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1 text-sm">{utilities}</div>
        </div>
      </header>
      <MobileBar items={items} current={current} text={mobileText(ui)} styles={softMobile}>
        {utilities}
      </MobileBar>
    </>
  );
}

// ---- Executive: an index of tabs, like a binder's. The current page is the inverted tab.
const executiveMobile: MobileStyles = {
  bar: 'border-t border-ink bg-surface text-ink',
  item: `${BASE_BAR_ITEM} font-semibold`,
  current: 'bg-ink text-page',
  sheet: 'bg-surface text-ink',
  sheetLink: `block border-b border-line py-3 text-lg font-semibold ${focusRing}`,
  sheetCurrent: 'bg-ink px-3 text-page',
  close: `${BASE_CLOSE} rounded border border-ink`,
};

function ExecutiveNav({ profile, items, current, languages, ui }: NavProps) {
  const button = `inline-flex items-center gap-1.5 px-3 text-sm underline underline-offset-4 hover:no-underline ${focusRing}`;
  const utilities = (
    <Utilities profile={profile} languages={languages} ui={ui} buttonClassName={button} />
  );
  return (
    <>
      <header
        data-sitenav=""
        className="sticky top-0 z-30 hidden border-b border-ink bg-surface text-ink sm:block print:hidden"
      >
        <div className="mx-auto flex max-w-[110rem] items-stretch justify-between gap-4 px-4">
          <nav aria-label={ui.pages.nav}>
            <ol className="flex flex-wrap">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={item.key === current ? 'page' : undefined}
                    className={`flex h-12 items-center px-4 text-sm font-semibold hover:bg-page aria-[current=page]:bg-ink aria-[current=page]:text-page ${focusRing} focus-visible:-outline-offset-4`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div className="flex items-center gap-2 text-sm">{utilities}</div>
        </div>
      </header>
      <MobileBar items={items} current={current} text={mobileText(ui)} styles={executiveMobile}>
        {utilities}
      </MobileBar>
    </>
  );
}

// ---- Creative: big, heavy type under a thick rule. The current page is underlined with a thick line.
const creativeMobile: MobileStyles = {
  bar: 'border-t-4 border-ink bg-page text-ink',
  item: `${BASE_BAR_ITEM} font-black`,
  current: 'underline decoration-4 underline-offset-8',
  sheet: 'bg-page text-ink',
  sheetLink: `block border-b-4 border-ink py-4 text-4xl font-black tracking-tight ${focusRing}`,
  sheetCurrent: 'underline decoration-8 decoration-accent underline-offset-8',
  close: `${BASE_CLOSE} rounded-full border-2 border-ink`,
};

function CreativeNav({ profile, items, current, languages, ui }: NavProps) {
  const button = `inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-sm font-bold hover:bg-ink hover:text-page ${focusRing}`;
  const utilities = (
    <Utilities profile={profile} languages={languages} ui={ui} buttonClassName={button} />
  );
  return (
    <>
      <header
        data-sitenav=""
        className="sticky top-0 z-30 hidden border-b-4 border-ink bg-page text-ink sm:block print:hidden"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <nav aria-label={ui.pages.nav}>
            <ul className="flex flex-wrap gap-x-2">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={item.key === current ? 'page' : undefined}
                    className={`inline-block py-2.5 pe-3 text-lg font-black underline-offset-[10px] hover:underline hover:decoration-4 aria-[current=page]:underline aria-[current=page]:decoration-[6px] aria-[current=page]:decoration-accent ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2 text-sm">{utilities}</div>
        </div>
      </header>
      <MobileBar items={items} current={current} text={mobileText(ui)} styles={creativeMobile}>
        {utilities}
      </MobileBar>
    </>
  );
}

// ---- Sidebar: the navigation is the dark rail itself (components/themes/sidebar/Rail.tsx), on every
// screen size; the theme draws the rail, so this only hands it the pages.
function SidebarNav({ profile, items, current, languages }: NavProps) {
  return (
    <Rail profile={profile} items={items} mode="pages" current={current} languages={languages} />
  );
}

// ---- Aurora: a slim pinned bar on every screen size (a menu button on a phone); the theme draws it.
function AuroraNav({ profile, items, current, languages }: NavProps) {
  return (
    <AuroraBar
      profile={profile}
      items={items}
      mode="pages"
      current={current}
      languages={languages}
    />
  );
}

// ---- Index: a slim left rail on wide screens, a top bar with a menu button below 900px; the theme draws it.
function IndexNav({ profile, items, current, languages }: NavProps) {
  return (
    <IndexRail
      profile={profile}
      items={items}
      mode="pages"
      current={current}
      languages={languages}
    />
  );
}

export const THEME_NAVS: Record<ThemeKey, ComponentType<NavProps>> = {
  index: IndexNav,
  editorial: EditorialNav,
  bento: BentoNav,
  soft: SoftNav,
  executive: ExecutiveNav,
  creative: CreativeNav,
  sidebar: SidebarNav,
  aurora: AuroraNav,
};

// How much of the top of the screen the navigation takes while the page scrolls, for the sticky things
// below it (a theme's section labels). The masthead and the soft row scroll away with the page.
export const NAV_STICKY_HEIGHT: Record<ThemeKey, string> = {
  index: '0px', // the rail is beside the page, or a bar that scrolls away on a phone
  editorial: '0px',
  bento: '4.25rem',
  soft: '0px',
  executive: '3rem',
  creative: '3.5rem',
  sidebar: '0px', // the navigation is a side rail, or a bar that scrolls away on a phone
  aurora: '4rem', // the slim bar stays pinned
};
