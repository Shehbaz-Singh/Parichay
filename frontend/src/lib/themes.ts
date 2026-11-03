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
  editorial: {
    name: 'Editorial',
    description: 'A quiet magazine page: serif headings, a narrow reading column, generous space.',
  },
  bento: {
    name: 'Bento',
    description: 'A grid of rounded tiles that adapt to your content, tinted by your accent color.',
  },
  creative: {
    name: 'Creative',
    description: 'Bold type, a header in your accent color and an expressive layout.',
  },
  soft: {
    name: 'Soft',
    description:
      'Warm and calm: a centered introduction, a narrow column, a quiet timeline and one tint of your accent.',
  },
  executive: {
    name: 'Executive',
    description:
      'A professional two-column resume: sidebar with contact and skills, dense text, prints cleanly.',
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
