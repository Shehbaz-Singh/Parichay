import type { ThemeKey } from '@parichay/shared';
import { accentVars } from '../color';
import { PALETTES } from '../palettes';

// The look of each theme on paper: its colors (the same values as the theme's CSS in globals.css)
// and its two fonts. The accent comes from the profile, in the readable shades the page uses.
export interface Tokens {
  display: string; // headings
  body: string;
  mono: string | null; // small labels, where the theme uses one
  italic: boolean; // the display font has an italic (only then is italic text used)
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string; // fills
  accentFg: string; // accent-colored text on the page background
  onAccent: string; // text on a fill of the accent
}

// `share` of a over the rest of b (what CSS color-mix(in srgb) does).
export function mix(a: string, b: string, share: number): string {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [ca, cb] = [channels(a), channels(b)];
  return (
    '#' +
    ca
      .map((v, i) => Math.round(v * share + cb[i] * (1 - share)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function tokensFor(theme: ThemeKey, accentColor: string): Tokens {
  const vars = accentVars(accentColor, PALETTES[theme]);
  const accent = vars['--accent'];
  const base = { accent, accentFg: vars['--accent-fg'], onAccent: vars['--on-accent'] };
  switch (theme) {
    case 'bento':
      return {
        ...base,
        display: 'Sora',
        body: 'Plus Jakarta Sans',
        mono: null,
        italic: false,
        bg: '#f5f6fa',
        surface: '#ffffff',
        ink: '#141824',
        muted: '#555b6e',
        line: '#dfe2ec',
      };
    case 'soft':
      return {
        ...base,
        display: 'Fredoka',
        body: 'Nunito Sans',
        mono: null,
        italic: false,
        bg: mix(accent, '#fffaf6', 0.07),
        surface: '#ffffff',
        ink: '#2a2431',
        muted: '#5f5868',
        line: mix(accent, '#e9e2e6', 0.2),
      };
    case 'sidebar':
    case 'aurora':
    case 'executive':
      return {
        ...base,
        display: 'Source Serif 4',
        body: 'Source Sans 3',
        mono: null,
        italic: false,
        bg: '#ffffff',
        surface: '#ffffff',
        ink: '#171a21',
        muted: '#4b5262',
        line: '#d5d9e1',
      };
    case 'creative':
      return {
        ...base,
        display: 'Bricolage Grotesque',
        body: 'Bricolage Grotesque',
        mono: 'Space Mono',
        italic: false,
        bg: '#ffffff',
        surface: '#f4f4f5',
        ink: '#09090b',
        muted: '#52525b',
        line: '#d4d4d8',
      };
    case 'editorial':
    default:
      return {
        ...base,
        display: 'Newsreader',
        body: 'Hanken Grotesk',
        mono: null,
        italic: true,
        bg: '#faf8f4',
        surface: '#f0ece4',
        ink: '#1f1c18',
        muted: '#5b564e',
        line: '#ddd6ca',
      };
  }
}
