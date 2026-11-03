import type { ReactElement, ReactNode } from 'react';
import type { PublicProfile } from '@parichay/shared';
import type { ThemeView } from './blocks';

// Every theme is a component that receives the whole public profile and draws the page. It never
// fetches anything: the profile arrives ready, and components/themes/blocks.ts turns it into the
// header and the sections to draw. To add a theme: create components/themes/<Name>Theme.tsx and
// register it in lib/themes.ts (and add its key to THEME_KEYS in the shared package).
export interface ThemeProps {
  profile: PublicProfile;
  // Put in front of the ids a theme creates, for the rare page that draws a profile twice.
  idPrefix?: string;
  // Which page of a split profile to draw (see pageSplit in blocks.ts). Left out: the whole page.
  view?: ThemeView;
  // The slim navigation of a split profile, drawn at the very top (see SiteNav).
  nav?: ReactNode;
}

export type ThemeComponent = (props: ThemeProps) => ReactElement;
