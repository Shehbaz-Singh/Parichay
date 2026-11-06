import type { CSSProperties, ReactNode } from 'react';
import type { PublicProfile, ThemeKey } from '@parichay/shared';
import { uiFor } from '@/lib/i18n';
import { themeColors, type Appearance } from '@/lib/palette';
import { AnnouncementBanner } from '../announcement/AnnouncementBanner';
import { FxLoader } from './fx/FxLoader';
import { NAV_STICKY_HEIGHT } from '../portfolio/nav/themed-navs';

const NO_JS =
  '.readmore[data-clamp]{display:block;-webkit-line-clamp:unset;overflow:visible}.collapse-body{display:block!important}.readmore-btn,.collapse-btn{display:none!important}';

// The root element of every theme. `theme-root` defines the color variables (globals.css), and
// the profile's accent is set inline here, so the server renders the right colors in the first
// HTML and nothing changes color after the page loads. A theme that wants other base colors has a
// class (`theme-<key>`) that redefines the variables; the accent keeps working. The theme comes
// from the component, not the profile, because the dashboard draws every theme with one profile.
export function ThemeWrapper({
  theme,
  profile,
  className = '',
  vars,
  nav,
  appearance = 'dark',
  children,
}: {
  theme: ThemeKey;
  // The accent, and what the announcement bar needs: it, the profile's address (to remember a closing) and
  // the language it is shown in. Without an announcement the bar is not drawn.
  profile: Pick<PublicProfile, 'accentColor'> &
    Partial<Pick<PublicProfile, 'announcement' | 'slug' | 'locale'>>;
  className?: string; // the theme's font classes
  vars?: Record<string, string>; // extra CSS variables of the theme
  nav?: ReactNode; // the navigation of a multi-page portfolio, in front of the page
  appearance?: Appearance; // Aurora's dark or light look; the other themes have one
  children: ReactNode;
}) {
  // Sidebar's navigation is a rail beside the page, not a bar above or below it: the page and the rail
  // share a row from 900px up, and there is no bottom bar to leave room for.
  const side = theme === 'sidebar' || theme === 'index';
  // Aurora's bar is at the top on every screen size, so there is no bottom bar to leave room for either.
  const aurora = theme === 'aurora';
  // The announcement bar, once for every theme: above everything else, or (beside a side rail) the first
  // thing in the column of the page. It is not sticky, so a sticky navigation and anchor links are not
  // affected once it has scrolled away.
  const announcement = profile.announcement ? (
    <AnnouncementBanner
      announcement={profile.announcement}
      slug={profile.slug ?? ''}
      words={uiFor(profile.locale ?? 'en').announcement}
    />
  ) : null;
  return (
    <div
      data-portfolio=""
      data-fx-theme={theme}
      data-appearance={theme === 'aurora' ? appearance : undefined}
      // With a navigation there is a bar at the bottom of a phone's screen: room is left for it.
      className={`theme-root min-h-screen overflow-x-clip theme-${theme} ${className} ${
        nav && !side && !aurora
          ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:pb-0 print:pb-0'
          : ''
      }`}
      style={
        {
          // The theme's whole palette, from the accent, worked out and contrast-checked on the server
          // (lib/palette): the first HTML already has the right colors.
          ...themeColors(theme, profile.accentColor, appearance).vars,
          ...(theme === 'aurora' && appearance === 'light' ? { colorScheme: 'light' } : {}),
          // How much of the top of the screen the sticky navigation takes, for sticky things below it.
          ...(nav ? { '--nav-h': NAV_STICKY_HEIGHT[theme] } : {}),
          ...vars,
        } as CSSProperties
      }
    >
      {/* Without JavaScript nothing can be opened, so nothing is folded. */}
      <FxLoader />
      <noscript>
        <style>{NO_JS}</style>
      </noscript>
      {side && nav ? (
        <div className="min-[900px]:flex">
          {nav}
          <div className="min-w-0 flex-1">
            {announcement}
            {children}
          </div>
        </div>
      ) : (
        <>
          {announcement}
          {nav}
          {children}
        </>
      )}
    </div>
  );
}
