import type { ThemeKey } from '@parichay/shared';
import { buildPalette, type Palette } from './palette';
import {
  ensureContrast,
  hex,
  lch,
  mixHex,
  ratio,
  readableOn,
  shiftHue,
  type Adjustment,
} from './oklch';

// How each theme uses the palette. A recipe turns the owner's accent into the CSS variables of that theme's
// wrapper: the surfaces, the text, the accent as text and as a fill, and the extras its effects use (the
// wash and mesh colors, the glow of Aurora, the bands of Sidebar). Every pairing of text and background is
// then checked: a pair that fails (4.5:1 for text, 3:1 for parts of the UI) has its foreground moved in
// lightness until it passes, and the move is recorded. The recipes differ in which steps of the scale they
// take and how far they go, so the themes are not one palette recolored.

export const TEXT_MIN = 4.5;
export const UI_MIN = 3;
// A shift of the accent's lightness bigger than this is "heavy": the owner is told in the accent picker.
export const HEAVY_SHIFT = 0.12;

export interface ThemeColors {
  vars: Record<string, string>;
  adjustments: Adjustment[];
  // How far the owner's own accent had to move to be used as text or as a button in this theme.
  accentShift: number;
}

type Vars = Record<string, string>;

class Checker {
  adjustments: Adjustment[] = [];
  accentShift = 0;
  // `fg` on each of `bgs`. Returns the (possibly moved) foreground.
  text(name: string, fg: string, bgs: string[], min = TEXT_MIN, ownColor = false): string {
    const { color, shift } = ensureContrast(fg, bgs, min);
    if (shift > 0) {
      this.adjustments.push({ pair: name, from: fg, to: color, shift });
      if (ownColor) this.accentShift = Math.max(this.accentShift, shift);
    }
    return color;
  }
  // A background fitted to its text: `bg` moves away from `fg` until the text reads.
  fill(name: string, bg: string, fg: string, min = TEXT_MIN, ownColor = false): string {
    return this.text(name, bg, [fg], min, ownColor);
  }
}

// The variables every theme sets, from the surfaces it chose.
function base(
  p: Palette,
  c: Checker,
  s: { bg: string; surface: string; text: string; muted: string; border: string },
  // other backgrounds the text sits on in this theme (tiles, a wash): all of them are checked too
  also: string[] = [],
): Vars {
  const soft = mixHex(p.accent, s.bg, 0.12);
  const text = c.text('text on page', s.text, [s.bg, s.surface, soft, ...also]);
  const muted = c.text('muted on page', s.muted, [s.bg, s.surface, soft, ...also]);
  const accentFg = c.text('accent text', p.accent, [s.bg, soft, ...also], TEXT_MIN, true);
  return {
    '--bg': s.bg,
    '--surface': s.surface,
    '--text': text,
    '--muted': muted,
    '--border': s.border,
    '--accent': p.accent,
    '--on-accent': readableOn(p.accent),
    '--accent-fg': accentFg,
    '--accent-soft': soft,
    // The neighbors, for the gradients and the one complementary touch.
    '--p-warm': p.warm[500],
    '--p-cool': p.cool[500],
    '--p-warm-soft': p.warm[200],
    '--p-cool-soft': p.cool[200],
    '--p-tint': p.scale[100],
    '--p-comp': p.complement.deep,
  };
}

function editorial(p: Palette, c: Checker): Vars {
  // Warm paper and ink: the lightest tinted gray for the page, a step down for rules and panels.
  return base(p, c, {
    bg: p.neutral(0.972, 0.012, 85),
    surface: p.neutral(0.945, 0.014, 85),
    text: p.neutral(0.2, 0.012, 70),
    muted: p.neutral(0.44, 0.014, 70),
    border: p.neutral(0.84, 0.014, 85),
  });
}

function bento(p: Palette, c: Checker): Vars {
  // The tiles are neutral; the accent is a whisper in the strong tile and the one mesh tile.
  const tile = p.neutral(0.99, 0.004, 255);
  const tileStrong = mixHex(p.scale[100], tile, 0.45);
  const meshA = mixHex(p.scale[200], tile, 0.5);
  const meshB = mixHex(p.cool[200], tile, 0.45);
  const meshC = mixHex(p.warm[100], tile, 0.5);
  const vars = base(
    p,
    c,
    {
      bg: p.neutral(0.965, 0.008, 255),
      surface: p.neutral(0.992, 0.004, 255),
      text: p.neutral(0.2, 0.02, 262),
      muted: p.neutral(0.45, 0.02, 262),
      border: p.neutral(0.9, 0.01, 255),
    },
    [tileStrong, meshA, meshB, meshC],
  );
  // The tiles take their tint from the scale instead of mixing the accent with white; the featured tile
  // gets a mesh of the accent and a neighbor (see .bento-tile[data-tone='mesh'] in theme-fx.css).
  return {
    ...vars,
    '--tile-base': tile,
    '--tile-base-strong': tileStrong,
    '--tile-base-border': p.neutral(0.9, 0.01, 255),
    '--mesh-a': meshA,
    '--mesh-b': meshB,
    '--mesh-c': meshC,
  };
}

function soft(p: Palette, c: Checker): Vars {
  // The wash is cream with a breath of the accent and its warm neighbor, not the accent's color.
  const cream = p.neutral(0.97, 0.014, 70);
  const washA = mixHex(p.scale[100], cream, 0.3);
  const washB = mixHex(p.warm[100], cream, 0.3);
  const vars = base(
    p,
    c,
    {
      bg: p.neutral(0.976, 0.014, 70),
      surface: p.neutral(0.996, 0.004, 70),
      text: p.neutral(0.26, 0.02, 40),
      muted: p.neutral(0.45, 0.02, 40),
      border: p.neutral(0.9, 0.014, 70),
    },
    [washA, washB],
  );
  return { ...vars, '--wash-a': washA, '--wash-b': washB };
}

function executive(p: Palette, c: Checker): Vars {
  const vars = base(p, c, {
    bg: p.neutral(0.93, 0.008, 250), // the desk
    surface: p.neutral(0.987, 0.003, 250), // the paper
    text: p.neutral(0.22, 0.015, 255),
    muted: p.neutral(0.43, 0.015, 255),
    border: p.neutral(0.8, 0.01, 250),
  });
  // The sidebar: deep slate with a slow wash toward a breath of the accent at the bottom. White text on
  // both ends was checked here.
  const slate = p.neutral(0.24, 0.02, 255);
  const sideA = c.fill('sidebar top', slate, '#ffffff', 7);
  const sideB = c.fill('sidebar bottom', mixHex(p.tone(0.24, 0.6), slate, 0.3), '#ffffff', 7);
  return { ...vars, '--side-a': sideA, '--side-b': sideB };
}

function creative(p: Palette, c: Checker): Vars {
  const vars = base(p, c, {
    bg: p.neutral(0.995, 0.002, 100),
    surface: p.neutral(0.962, 0.004, 100),
    text: p.neutral(0.13, 0.006, 100),
    muted: p.neutral(0.42, 0.008, 100),
    border: p.neutral(0.8, 0.006, 100),
  });
  // The one gradient: the header band, from the accent to a neighbor 30 degrees along. The text on it
  // reads on both ends.
  const on = readableOn(p.accent);
  const a = c.fill('header start', p.accent, on, TEXT_MIN, true);
  const own = lch(a);
  const b = c.fill(
    'header end',
    hex({ l: own.l + (on === '#ffffff' ? -0.04 : 0.04), c: own.c, h: shiftHue(own.h, 30) }),
    on,
  );
  return { ...vars, '--hdr-a': a, '--hdr-b': b, '--hdr-on': on };
}

function sidebar(p: Palette, c: Checker): Vars {
  const vars = base(p, c, {
    bg: p.neutral(0.985, 0.005, 80),
    surface: p.neutral(0.998, 0.003, 80),
    text: p.neutral(0.19, 0.008, 80),
    muted: p.neutral(0.42, 0.01, 80),
    border: p.neutral(0.88, 0.008, 80),
  });
  const rail = p.neutral(0.17, 0.012, 270); // charcoal; only the mark and the bands carry the accent
  const mark = c.text('rail mark', p.scale[300], [rail]);
  // The two bands: the accent and a hue 25 degrees along, both darkened until white reads (4.6:1) on each
  // and on the middle of the gradient. A hueless accent gets one solid color.
  let a = c.fill('band start', p.accent, '#ffffff', 4.6, true);
  const own = lch(a);
  let b = p.neutralAccent
    ? a
    : c.fill(
        'band end',
        hex({ l: own.l + 0.03, c: own.c, h: shiftHue(own.h, 25) }),
        '#ffffff',
        4.6,
      );
  const worstMiddle = () =>
    Math.min(...[0.25, 0.5, 0.75].map((share) => ratio(mixHex(a, b, share), '#ffffff')));
  for (let i = 0; i < 40 && worstMiddle() < 4.6; i++) {
    a = hex({ ...lch(a), l: lch(a).l - 0.01 });
    b = hex({ ...lch(b), l: lch(b).l - 0.01 });
  }
  return { ...vars, '--rail': rail, '--rail-mark': mark, '--band-a': a, '--band-b': b };
}

// The light variant: the same layout on warm off-white. The glow becomes a soft wash of the accent (the
// strength is lowered until the muted text on its darkest point reads 5:1), cards are white with a hairline
// border and nothing moves. Every pair is checked like the dark one.
function auroraLight(p: Palette, c: Checker): Vars {
  const bg = p.neutral(0.985, 0.008, 80);
  const raised = p.neutral(0.998, 0.003, 80);
  const raisedHover = p.neutral(0.962, 0.006, 80);
  const border = p.neutral(0.87, 0.008, 80);
  const tint = mixHex(p.accent, bg, 0.1);
  const text = c.text('text on page', p.neutral(0.2, 0.008, 80), [bg, raisedHover, tint]);
  const muted = c.text('muted on page', p.neutral(0.42, 0.01, 80), [bg, raisedHover, tint]);
  const accentText = c.text('accent text', p.accent, [bg, raisedHover, tint], TEXT_MIN, true);
  const glow = p.accent;
  const glowSoft = mixHex(p.cool[400], bg, 0.5);
  let alpha = 0.16;
  const stacked = (a: number) => 1 - (1 - a) * (1 - a * 0.7) * (1 - a * 0.5);
  const darkest = (a: number) => mixHex(glow, bg, stacked(a));
  while (
    alpha > 0 &&
    (ratio(muted, darkest(alpha)) < 5 ||
      ratio(text, darkest(alpha)) < 7 ||
      ratio(accentText, darkest(alpha)) < 4.5)
  )
    alpha -= 0.01;
  return {
    '--bg': bg,
    '--surface': raised,
    '--text': text,
    '--muted': muted,
    '--border': border,
    '--accent': accentText,
    '--on-accent': readableOn(accentText),
    '--accent-fg': accentText,
    '--accent-soft': tint,
    '--au-raised': raised,
    '--au-raised-hover': raisedHover,
    '--au-glow': glow,
    '--au-glow-soft': glowSoft,
    '--au-glow-alpha': `${Math.round(Math.max(0, alpha) * 100)}%`,
    '--danger': '#b91c1c',
    '--danger-bg': '#fef2f2',
    '--danger-border': '#fecaca',
    '--warning-bg': '#fffbeb',
    '--warning-fg': '#92400e',
    '--p-warm': p.warm[600],
    '--p-cool': p.cool[600],
    '--p-comp': p.complement.deep,
  };
}

function aurora(p: Palette, c: Checker): Vars {
  // Deep ink, not the accent's color: the glow is what carries the accent.
  const bg = p.neutral(0.155, 0.01, 270);
  const raised = p.neutral(0.195, 0.01, 270);
  const raisedHover = p.neutral(0.23, 0.01, 270);
  const border = p.neutral(0.31, 0.01, 270);
  const text = c.text('text on page', p.neutral(0.95, 0.006, 270), [raisedHover]);
  const muted = c.text('muted on page', p.neutral(0.79, 0.01, 270), [raisedHover]);
  // The accent as text, ring and button fill: lightened until it reads on the lightest surface.
  const accentText = c.text('accent text', p.accent, [raisedHover], TEXT_MIN, true);
  const tint = mixHex(p.accent, bg, 0.14);
  // On the typographic cover tint the same color has to read too.
  const onTint = c.text('accent on cover', accentText, [tint]);
  // The glow is the accent's lightened color plus a neighbor; its strength is lowered until the muted
  // text on the brightest point (the layers stacked) is at least 5:1. See .au-glow in theme-fx.css.
  const glow = accentText;
  const glowSoft = mixHex(c.text('glow neighbor', p.cool[400], [bg], 3), bg, 0.7);
  // Calm by default: a lower start than before, then lowered per accent until the text reads.
  let alpha = 0.28;
  const stacked = (a: number) => 1 - (1 - a) * (1 - a * 0.7) * (1 - a * 0.5);
  // (and so that the accent, as the button fill, still stands out from the glow behind it: 3:1)
  const brightest = (a: number) => mixHex(glow, bg, stacked(a));
  while (
    alpha > 0 &&
    (ratio(muted, brightest(alpha)) < 5 || ratio(accentText, brightest(alpha)) < 3)
  )
    alpha -= 0.01;
  return {
    '--bg': bg,
    '--surface': raised,
    '--text': text,
    '--muted': muted,
    '--border': border,
    '--accent': onTint,
    '--on-accent': readableOn(onTint),
    '--accent-fg': onTint,
    '--accent-soft': tint,
    '--au-raised': raised,
    '--au-raised-hover': raisedHover,
    '--au-glow': glow,
    '--au-glow-soft': glowSoft,
    '--au-glow-alpha': `${Math.round(Math.max(0, alpha) * 100)}%`,
    '--p-warm': p.warm[400],
    '--p-cool': p.cool[400],
    '--p-comp': p.complement.light,
  };
}

const RECIPES: Record<ThemeKey, (p: Palette, c: Checker) => Vars> = {
  editorial,
  bento,
  soft,
  executive,
  creative,
  sidebar,
  aurora,
};

// The colors of a theme for an accent, server-side.
export type Appearance = 'dark' | 'light';

export function themeColors(
  theme: ThemeKey,
  accentColor: string | null | undefined,
  appearance: Appearance = 'dark',
): ThemeColors {
  const palette = buildPalette(accentColor);
  const checker = new Checker();
  // Aurora is the one theme with two looks; the others ignore the appearance.
  const recipe = theme === 'aurora' && appearance === 'light' ? auroraLight : RECIPES[theme];
  const vars = recipe(palette, checker);
  return { vars, adjustments: checker.adjustments, accentShift: checker.accentShift };
}
