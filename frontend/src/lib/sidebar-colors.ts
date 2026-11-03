import { DEFAULT_ACCENT } from '@parichay/shared';
import { contrastRatio, mix, normalizeHex } from './color';

// The colors of the Sidebar theme that the accent decides, worked out here so they are checked, not hoped:
//
// - the rail: a near-black with a little of the accent in it. It is always dark, so white text on it
//   keeps its contrast in every accent color;
// - the mark: the accent moved toward white until it reads (4.5:1) on the rail, for the current-page bar,
//   the focus ring and links in the rail;
// - the band: the two surfaces that carry a gradient (the experience band and the contact panel). The
//   gradient goes from the accent to a hue 25 degrees along, a little lighter, and both ends are darkened
//   until white text reads on them (and on the middle). A gray accent (no hue to shift) gets one solid
//   color instead, so the "gradient" never turns into mud.

const WHITE = '#ffffff';
const NEAR_BLACK = '#0d0e11';
const BAND_CONTRAST = 4.6; // a little above AA, for the part of the gradient between the two ends
const HUE_SHIFT = 25;
const LIGHTER = 0.06;
const GRAY = 0.12; // below this saturation the accent has no hue worth shifting

type Hsl = [number, number, number]; // degrees, 0..1, 0..1

function toHsl(hex: string): Hsl {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function fromHsl([h, s, l]: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

// Darkens a color a step at a time until white reads on it.
function darkenForWhite(color: Hsl, target = BAND_CONTRAST): Hsl {
  const [h, s] = color;
  let l = color[2];
  while (l > 0 && contrastRatio(fromHsl([h, s, l]), WHITE) < target) l = Math.max(0, l - 0.01);
  return [h, s, l];
}

export interface SidebarColors {
  rail: string;
  mark: string;
  bandA: string;
  bandB: string;
  flat: boolean; // one solid color instead of a gradient
}

export function sidebarColors(accentColor: string | null | undefined): SidebarColors {
  const accent = normalizeHex(accentColor) ?? DEFAULT_ACCENT;
  const rail = mix(accent, NEAR_BLACK, 0.1);

  // The accent, lightened toward white until it reads on the rail.
  let mark = WHITE;
  for (let toward = 0; toward <= 1; toward += 0.05) {
    const candidate = mix(WHITE, accent, toward);
    if (contrastRatio(candidate, rail) >= 4.5) {
      mark = candidate;
      break;
    }
  }

  const [h, s, l] = toHsl(accent);
  const flat = s < GRAY;
  let a = darkenForWhite([h, s, l]);
  let b = flat ? a : darkenForWhite([(h + HUE_SHIFT) % 360, s, Math.min(1, l + LIGHTER)]);
  // The middle of the gradient has to read too: darken both ends together until it does.
  while (
    !flat &&
    a[2] > 0 &&
    contrastRatio(mix(fromHsl(a), fromHsl(b), 0.5), WHITE) < BAND_CONTRAST
  ) {
    a = [a[0], a[1], Math.max(0, a[2] - 0.01)];
    b = [b[0], b[1], Math.max(0, b[2] - 0.01)];
  }
  return { rail, mark, bandA: fromHsl(a), bandB: fromHsl(b), flat };
}

// The CSS variables the theme's wrapper sets (see .sb-rail and .sb-band in globals.css).
export function sidebarVars(accentColor: string | null | undefined): Record<string, string> {
  const { rail, mark, bandA, bandB } = sidebarColors(accentColor);
  return { '--rail': rail, '--rail-mark': mark, '--band-a': bandA, '--band-b': bandB };
}
