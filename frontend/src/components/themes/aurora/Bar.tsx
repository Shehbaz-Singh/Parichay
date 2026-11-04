import type { PublicProfile } from '@parichay/shared';
import { uiFor } from '@/lib/i18n';
import { LanguageSwitcher, type LanguageLink } from '../../portfolio/LanguageSwitcher';
import { ReadingPreferences } from '../../portfolio/ReadingPreferences';
import { AuroraBarView, type BarAction, type BarItem } from '../../portfolio/nav/AuroraBar';
import { buildHeader } from '../blocks';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

// The Aurora theme's top bar, for both modes: the single page (links to its sections) and a multi-page
// portfolio (links to its pages, with the language links and reading preferences, which the theme's nav
// carries there). The interactive part is AuroraBarView; this works out what goes in it. The one action
// is Contact (a section, or the Contact page); with no contact to go to, the resume download.
export function AuroraBar({
  profile,
  items,
  mode,
  current,
  languages = [],
  idPrefix = '',
  contactHref,
}: {
  profile: PublicProfile;
  items: BarItem[];
  mode: 'pages' | 'sections';
  current?: string;
  languages?: LanguageLink[];
  idPrefix?: string;
  contactHref?: string | null; // single page: the contact section's anchor
}) {
  const header = buildHeader(profile);
  const ui = uiFor(profile.locale);
  const contactItem = items.find((item) => item.key === 'contact');
  const target =
    mode === 'pages'
      ? contactItem
        ? { href: contactItem.href, label: contactItem.label }
        : null
      : contactHref
        ? { href: contactHref, label: ui.sidebar.talk }
        : null;
  const action: BarAction | null = target
    ? target
    : header.resume
      ? { href: header.resume.href, label: header.resume.label, download: true }
      : null;
  const button = `inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 pt-small font-medium hover:bg-surface ${focusRing}`;
  return (
    <AuroraBarView
      logo={profile.fullName}
      homeHref={mode === 'pages' ? (items[0]?.href ?? '/') : `#${idPrefix}intro`}
      items={items}
      mode={mode}
      current={current}
      mainId={`${idPrefix}main`}
      text={{
        nav: ui.pages.nav,
        menu: ui.sidebar.menu,
        close: ui.sidebar.closeMenu,
        skip: ui.sidebar.skip,
      }}
      action={action}
    >
      {languages.length > 1 && (
        <LanguageSwitcher
          links={languages}
          current={profile.locale}
          label={ui.switcher.label}
          inNav
        />
      )}
      {<ReadingPreferences ui={ui.reading} triggerClassName={button} />}
    </AuroraBarView>
  );
}
