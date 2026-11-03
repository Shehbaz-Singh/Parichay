import type { PublicProfile } from '@parichay/shared';
import { getTheme } from '@/lib/themes';
import { isMulti, navItems } from '@/lib/pages';
import { uiFor } from '@/lib/i18n';
import type { LanguageLink } from './LanguageSwitcher';
import { THEME_NAVS } from './nav/themed-navs';
import { RouteFocus } from './nav/RouteFocus';

// The navigation of a multi-page portfolio, drawn by the owner's theme: each theme has its own design
// (nav/themed-navs.tsx) for the same content, the owner's page names in their order. A single-page
// profile has none. `current` is the key of the page being shown ("home", "work", "page:<id>", ...); a
// project page is part of "work". `languages` are the links to this same page in the other languages;
// the nav carries them and the reading preferences, so the page has no strip above the theme.
export function SiteNav({
  profile,
  current,
  languages = [],
}: {
  profile: PublicProfile;
  current: string;
  languages?: LanguageLink[];
}) {
  if (!isMulti(profile) || profile.pages.length === 0) return null;
  const Nav = THEME_NAVS[getTheme(profile.theme).key];
  const ui = uiFor(profile.locale);
  return (
    <>
      <Nav
        profile={profile}
        items={navItems(profile)}
        current={current}
        languages={languages}
        ui={ui}
      />
      <RouteFocus />
    </>
  );
}
