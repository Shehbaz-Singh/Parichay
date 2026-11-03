import type { CSSProperties, ReactNode } from 'react';
import type { PublicProfile, ThemeKey } from '@parichay/shared';
import { accentVars } from '@/lib/color';
import { PALETTES } from '@/lib/palettes';
import { sidebarVars } from '@/lib/sidebar-colors';
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
  children,
}: {
  theme: ThemeKey;
  profile: Pick<PublicProfile, 'accentColor'>;
  className?: string; // the theme's font classes
  vars?: Record<string, string>; // extra CSS variables of the theme
  nav?: ReactNode; // the navigation of a multi-page portfolio, in front of the page
  children: ReactNode;
}) {
  // Sidebar's navigation is a rail beside the page, not a bar above or below it: the page and the rail
  // share a row from 900px up, and there is no bottom bar to leave room for.
  const side = theme === 'sidebar';
  return (
    <div
      data-portfolio=""
      // With a navigation there is a bar at the bottom of a phone's screen: room is left for it.
      className={`theme-root min-h-screen overflow-x-clip theme-${theme} ${className} ${
        nav && !side ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:pb-0 print:pb-0' : ''
      }`}
      style={
        {
          ...accentVars(profile.accentColor, PALETTES[theme]),
          // How much of the top of the screen the sticky navigation takes, for sticky things below it.
          ...(nav ? { '--nav-h': NAV_STICKY_HEIGHT[theme] } : {}),
          ...(side ? sidebarVars(profile.accentColor) : {}),
          ...vars,
        } as CSSProperties
      }
    >
      {/* Without JavaScript nothing can be opened, so nothing is folded. */}
      <noscript>
        <style>{NO_JS}</style>
      </noscript>
      {side && nav ? (
        <div className="min-[900px]:flex">
          {nav}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      ) : (
        <>
          {nav}
          {children}
        </>
      )}
    </div>
  );
}
