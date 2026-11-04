import { clampChroma, converter, formatHex, parse, wcagContrast } from 'culori';

// The color math every theme shares, on culori. Colors are #rrggbb strings outside this file (they go
// into style attributes, so they are always valid and always inside the sRGB gamut: there is no oklch()
// to fall back from). The math is OKLCH, where equal steps of lightness look equal, which is what a
// tint scale and a contrast fix need. It runs on the server; nothing here is imported by a client
// component of a public page, so it never ships to a visitor's browser.

const toOklch = converter('oklch');

export interface Lch {
  l: number; // 0..1
  c: number; // chroma, 0..~0.37
  h: number; // degrees
}

export function lch(hex: string): Lch {
  const color = toOklch(parse(hex) ?? parse('#000000')!);
  // A gray has no hue: culori leaves it undefined.
  return { l: color.l, c: color.c, h: color.h ?? 0 };
}

// The color for these coordinates, with the chroma lowered until it fits sRGB (the lightness and hue
// are kept, so a too-vivid ask becomes the most vivid color that exists, not a different color).
export function hex({ l, c, h }: Lch): string {
  const clamped = clampChroma(
    { mode: 'oklch', l: Math.min(1, Math.max(0, l)), c: Math.max(0, c), h },
    'oklch',
  );
  return formatHex(clamped);
}

export const ratio = (a: string, b: string) => wcagContrast(a, b);

export const mixHex = (a: string, b: string, share: number): string => {
  const [x, y] = [lch(a), lch(b)];
  // Mix in OKLCH along the shorter hue path (a gray has no hue of its own: it takes the other's).
  const hue = x.c < 0.004 ? y.h : y.c < 0.004 ? x.h : shortHue(x.h, y.h, share);
  return hex({ l: x.l * share + y.l * (1 - share), c: x.c * share + y.c * (1 - share), h: hue });
};

function shortHue(a: number, b: number, share: number): number {
  const diff = ((((b - a) % 360) + 540) % 360) - 180; // -180..180, from a to b
  return (a + diff * (1 - share) + 360) % 360;
}

export const shiftHue = (h: number, by: number) => (((h + by) % 360) + 360) % 360;

export interface Adjustment {
  pair: string; // "text on page"
  from: string;
  to: string;
  shift: number; // how far the lightness moved (OKLCH L, 0..1)
}

// `fg` moved in lightness (away from `bg`, the way that gains contrast) until it reads `min`:1 on every
// background given. The hue and chroma are kept. The result says how far it had to move. If it can go no
// further it ends at black or white.
export function ensureContrast(
  fg: string,
  backgrounds: string[],
  min: number,
): { color: string; shift: number } {
  const ok = (color: string) => backgrounds.every((bg) => ratio(color, bg) >= min);
  if (ok(fg)) return { color: fg, shift: 0 };
  const start = lch(fg);
  // Lighter or darker: toward whichever end the backgrounds are farthest from. If that runs out (white
  // text on a light page, black on a dark one) the other way is tried, so a white accent becomes a dark
  // gray on a light theme and a near-black accent a light gray on a dark one.
  const meanBg = backgrounds.reduce((sum, bg) => sum + lch(bg).l, 0) / backgrounds.length;
  const preferred = start.l >= meanBg ? 1 : -1;
  for (const dir of [preferred, -preferred]) {
    for (let step = 1; step <= 100; step++) {
      const l = start.l + (dir * step) / 100;
      if (l < 0 || l > 1) break;
      const candidate = hex({ ...start, l });
      if (ok(candidate)) return { color: candidate, shift: step / 100 };
    }
  }
  const worst = (color: string) => Math.min(...backgrounds.map((bg) => ratio(color, bg)));
  return { color: worst('#ffffff') >= worst('#000000') ? '#ffffff' : '#000000', shift: 1 };
}

export const readableOn = (color: string) =>
  ratio(color, '#000000') >= ratio(color, '#ffffff') ? '#000000' : '#ffffff';
