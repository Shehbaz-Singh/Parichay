import type { ReactElement, ReactNode } from 'react';
import type { PublicPage, PublicProfile } from '@parichay/shared';
import type { ContactPageState } from './ContactForm';

// Every theme is a component that receives the whole public profile and draws the page. It never
// fetches anything: the profile arrives ready, and components/themes/blocks.ts turns it into the
// header and the sections to draw. To add a theme: create components/themes/<Name>Theme.tsx and
// register it in lib/themes.ts (and add its key to THEME_KEYS in the shared package).
export interface ThemeProps {
  profile: PublicProfile;
  // Put in front of the ids a theme creates, for the rare page that draws a profile twice.
  idPrefix?: string;
  // The page of a multi-page portfolio to draw (Home, Work, About, Contact or a page the owner made).
  // Left out: the whole single page.
  page?: PublicPage;
  // The navigation of a multi-page portfolio, drawn at the very top (see SiteNav).
  nav?: ReactNode;
  // A project to draw on a page of its own (/work/<slug>), in either mode: the theme's project template.
  project?: PublicProfile['projects'][number];
  // The live contact form of the Contact page (its signed time stamp and the outcome of a post).
  contact?: ContactPageState | null;
  // Set on every page but Home and the single page: the page's title. The theme then draws its sections
  // without the big identity header, and the title is the page's heading for screen readers.
  heading?: string;
  // Set on pages with something of their own above the sections (a project, a page the owner made, the
  // Contact page): drawn in place of the heading, so it carries the page's one h1.
  lead?: ReactNode;
}

export type ThemeComponent = (props: ThemeProps) => ReactElement;
