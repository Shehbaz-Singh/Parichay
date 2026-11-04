import { DEFAULT_ACCENT } from '@parichay/shared';
import { normalizeHex } from '../color';
import { hex, lch, shiftHue, type Lch } from './oklch';

// The palette every theme draws from, made from the owner's accent in OKLCH:
//
// - `scale`: ten tints and shades of the accent (50 lightest, 900 darkest) at even steps of lightness, with
//   the chroma eased at both ends so the lightest are not pastel neon and the darkest not muddy;
// - `warm` / `cool`: the two analogous hues, 30 degrees either side, as shorter scales;
// - `complement`: the opposite hue, two tones, for the one small thing that should stand out. Themes use it
//   at most once a page;
// - `neutral`: grays tinted a little toward the accent's hue (never pure gray, black or white);
// - an accent with almost no chroma (gray, black, white) has no hue to build from, so it gets a built-in
//   secondary hue for the analogous and complementary colors. This is the one fixed hue in the system and
//   it only applies to accents that have none of their own.
//
// All values are gamut-mapped #rrggbb.

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type Step = (typeof STEPS)[number];
export type Scale = Record<Step, string>;

const LIGHTNESS: Record<Step, number> = {
  50: 0.975,
  100: 0.945,
  200: 0.89,
  300: 0.82,
  400: 0.73,
  500: 0.64,
  600: 0.55,
  700: 0.46,
  800: 0.37,
  900: 0.29,
};
// How much of the accent's chroma each step keeps.
const CHROMA: Record<Step, number> = {
  50: 0.12,
  100: 0.22,
  200: 0.42,
  300: 0.65,
  400: 0.85,
  500: 1,
  600: 1,
  700: 0.9,
  800: 0.75,
  900: 0.6,
};

const NEAR_NEUTRAL = 0.03; // chroma below this: no hue to build from
const NEUTRAL_HUE = 85; // the default warm paper hue
const SECONDARY_HUE = 255; // a calm blue, only for accents without a hue
const SECONDARY_CHROMA = 0.1;

function scaleOf(h: number, c: number): Scale {
  return Object.fromEntries(
    STEPS.map((step) => [step, hex({ l: LIGHTNESS[step], c: c * CHROMA[step], h })]),
  ) as Scale;
}

export interface Palette {
  accent: string; // the owner's color as chosen
  hue: number;
  chroma: number;
  neutralAccent: boolean; // true: the accent has no hue, and `warm`, `cool` and `complement` use the built-in one
  scale: Scale;
  warm: Scale;
  cool: Scale;
  complement: { light: string; deep: string };
  neutral: (l: number, chroma?: number, hue?: number) => string; // a curated near-neutral: its hue is the theme's, never the accent's
  tone: (l: number, chromaShare?: number) => string; // the accent hue at this lightness
}

export function buildPalette(accentColor: string | null | undefined): Palette {
  const accent = normalizeHex(accentColor) ?? DEFAULT_ACCENT;
  const own = lch(accent);
  const neutralAccent = own.c < NEAR_NEUTRAL;
  // The hue the neighbors are built around: the accent's own, or the built-in one.
  const base: Lch = neutralAccent
    ? { l: own.l, c: SECONDARY_CHROMA, h: SECONDARY_HUE }
    : { ...own, c: Math.min(own.c, 0.2) };
  // The scale follows the accent (a gray accent gets a gray scale); the neighbors use the base.
  const scale = scaleOf(own.h, Math.min(own.c, 0.2));
  const complementChroma = Math.min(base.c, 0.13);
  return {
    accent,
    hue: own.h,
    chroma: own.c,
    neutralAccent,
    scale,
    warm: scaleOf(shiftHue(base.h, -30), base.c * 0.9),
    cool: scaleOf(shiftHue(base.h, 30), base.c * 0.9),
    complement: {
      light: hex({ l: 0.78, c: complementChroma, h: shiftHue(base.h, 180) }),
      deep: hex({ l: 0.45, c: complementChroma, h: shiftHue(base.h, 180) }),
    },
    // Backgrounds and text are NOT the accent's color: a page that is the accent's hue looks like a
    // recolor. Each theme gives its own warm or cool hue (paper, slate, ink) and a whisper of chroma; the
    // accent only shows in the details, the gradients and the glow.
    neutral: (l, chroma = 0.01, hue = NEUTRAL_HUE) => hex({ l, c: chroma, h: hue }),
    tone: (l, chromaShare = 1) => hex({ l, c: Math.min(own.c, 0.2) * chromaShare, h: own.h }),
  };
}
