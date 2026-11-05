import type { ThemeKey } from '@parichay/shared';

// What the color math needs to know about each theme. The same values are the variables of
// the theme's class in globals.css (--bg and --text), so change them together.
export interface Palette {
  scheme: 'light' | 'dark';
  background: string;
  text: string;
}

// A Record over the shared key list, so a theme the API accepts cannot be missing here.
export const PALETTES: Record<ThemeKey, Palette> = {
  index: { scheme: 'light', background: '#fcfcfb', text: '#1b1c1f' },
  editorial: { scheme: 'light', background: '#faf8f4', text: '#1f1c18' },
  bento: { scheme: 'light', background: '#f5f6fa', text: '#141824' },
  creative: { scheme: 'light', background: '#ffffff', text: '#09090b' },
  executive: { scheme: 'light', background: '#eceef2', text: '#171a21' },
  soft: { scheme: 'light', background: '#faf6f3', text: '#2a2431' },
  sidebar: { scheme: 'light', background: '#fbfaf8', text: '#1c1b19' },
  aurora: { scheme: 'dark', background: '#0e0f14', text: '#eeedf2' },
};
