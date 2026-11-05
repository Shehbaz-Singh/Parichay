import { DEFAULT_THEME, THEME_KEYS, type ThemeKey } from '@parichay/shared';
import { PALETTES } from './palettes';

export { DEFAULT_THEME };

export interface ThemeEntry {
  key: ThemeKey; // the value stored in profile.theme
  name: string;
  description: string;
  // Light or dark and the page background, from lib/palettes.ts. The accent picker checks contrast
  // against them and the page tells the browser about them.
  scheme: 'light' | 'dark';
  background: string;
}

// Typed as a Record over the shared key list: the compiler fails here if a theme key that the API
// accepts has no entry, or an entry has no key. The components themselves are in
// theme-components.ts (all of them, for the editor) and theme-loader.ts (one, for a public page).
const entries: Record<ThemeKey, Omit<ThemeEntry, 'key' | 'scheme' | 'background'>> = {
  index: {
    name: 'Index',
    description: 'A brand-guidelines page: a slim sidebar, one soft gradient, numbered sections in a narrow column and hairline rules. Light only. The default.',
  },
  editorial: {
    name: 'Editorial',
    description: 'A quiet magazine page on warm paper: a narrow reading column, small-caps labels and dates in the margin.',
  },
  bento: {
    name: 'Bento',
    description: 'Rounded tiles on a cool page, with Experience as one full-width list and a whisper of your accent.',
  },
  creative: {
    name: 'Creative',
    description: 'Bold type, a slanted header band in your accent, hard borders and offset shadows.',
  },
  soft: {
    name: 'Soft',
    description: 'Warm and calm: a centered introduction, one narrow column, a quiet timeline and dark ink throughout.',
  },
  sidebar: {
    name: 'Sidebar',
    description: 'A dark side rail with your name and navigation beside an airy page, with Experience in a band of your accent.',
  },
  aurora: {
    name: 'Aurora',
    description: 'One soft glow of your accent behind the introduction, raised cards and a scrolling strip of selected work. Dark or light.',
  },
  executive: {
    name: 'Executive',
    description: 'A resume-like page: a dark sidebar with contact and skills, dense text led by Experience. Prints cleanly.',
  },
};

// In the order the picker shows them.
export const THEME_LIST: ThemeEntry[] = THEME_KEYS.map((key) => ({
  key,
  scheme: PALETTES[key].scheme,
  background: PALETTES[key].background,
  ...entries[key],
}));

// An unknown or retired theme name falls back to the default instead of breaking the page.
export function getTheme(key: string): ThemeEntry {
  return THEME_LIST.find((theme) => theme.key === key) ?? THEME_LIST[0];
}
