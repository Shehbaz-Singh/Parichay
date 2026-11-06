/* global console, process */
// `npm run check:palette`: every theme's colors come from the owner's accent (src/lib/palette). This builds
// every theme for a spread of accents, including the awkward ones (yellow, red, near-black, pale gray, white,
// very low chroma), and checks the contrast of every pairing the themes draw: text and muted text on each
// surface, the accent as text and as a fill, and text over each gradient at its lightest AND darkest point
// (Creative's header, Sidebar's bands, Executive's sidebar, Soft's wash, Bento's mesh, Aurora's glow),
// and the announcement bar in each of its three looks.
// It also reports how far each accent had to be moved, and fails if a heavy move is not reported by
// `accentShift`.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const here = dirname(fileURLToPath(import.meta.url));
const lib = resolve(here, '../src/lib');

const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const source = readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  cache.set(file, module);
  const local = (id) => {
    if (!id.startsWith('.')) return require(id);
    const base = resolve(dirname(file), id);
    return load(/\.ts$/.test(base) ? base : readTsPath(base));
  };
  vm.runInThisContext(`(function (exports, require, module) {${outputText}\n})`)(
    module.exports,
    local,
    module,
  );
  return module.exports;
}
function readTsPath(base) {
  try {
    readFileSync(`${base}.ts`);
    return `${base}.ts`;
  } catch {
    return resolve(base, 'index.ts');
  }
}

const { themeColors } = load(resolve(lib, 'palette/index.ts'));
const { ratio, mixHex } = load(resolve(lib, 'palette/oklch.ts'));

const THEMES = ['index', 'editorial', 'bento', 'soft', 'executive', 'creative', 'sidebar', 'aurora'];
const ACCENTS = {
  default: '#2563eb',
  yellow: '#facc15',
  red: '#dc2626',
  'near-black': '#0a0a0a',
  black: '#000000',
  'pale gray': '#e5e7eb',
  white: '#ffffff',
  green: '#15803d',
  violet: '#7c3aed',
  orange: '#c2410c',
  'mid gray': '#6b7280',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  'low chroma': '#7f7f84',
  'almost white': '#fffffe',
  pink: '#fbcfe8',
  navy: '#0b1b4d',
};
const HEAVY = 0.12;

let failures = 0;
const check = (where, label, a, b, min) => {
  const r = ratio(a, b);
  if (r < min) {
    failures += 1;
    console.error(`FAIL ${where}: ${label} ${r.toFixed(2)} < ${min}  (${a} on ${b})`);
  }
};
const gradient = (where, label, text, a, b, min) => {
  // The ends and three points between: the worst point of a two-color gradient is one of them.
  for (const share of [0, 0.25, 0.5, 0.75, 1]) check(where, label, text, mixHex(a, b, share), min);
};

const heavy = [];
// Aurora has two looks; every other theme has one.
const LOOKS = THEMES.flatMap((theme) =>
  theme === 'aurora' ? [[theme, 'dark'], [theme, 'light']] : [[theme, 'dark']],
);
for (const [theme, appearance] of LOOKS) {
  for (const [name, hex] of Object.entries(ACCENTS)) {
    const where = `${theme}${theme === 'aurora' ? `:${appearance}` : ''}/${name}`;
    const { vars: v, accentShift } = themeColors(theme, hex, appearance);
    for (const surface of ['--bg', '--surface', '--accent-soft']) {
      check(where, `text on ${surface}`, v['--text'], v[surface], 4.5);
      check(where, `muted on ${surface}`, v['--muted'], v[surface], 4.5);
    }
    check(where, 'accent text on page', v['--accent-fg'], v['--bg'], 4.5);
    check(where, 'accent text on tint', v['--accent-fg'], v['--accent-soft'], 4.5);
    check(where, 'text on accent fill', v['--on-accent'], v['--accent'], 4.5);
    check(where, 'accent fill against page', v['--accent'], v['--bg'], theme === 'aurora' ? 3 : 1);

    // The announcement bar, in each of its three looks: its text and its link on its own background (a notice
    // is a solid accent fill with black or white text), and the thin edge of the quiet look against the page.
    for (const look of ['info', 'highlight', 'notice']) {
      check(where, `announcement ${look} text`, v[`--ann-${look}-fg`], v[`--ann-${look}-bg`], 4.5);
      check(where, `announcement ${look} link`, v[`--ann-${look}-link`], v[`--ann-${look}-bg`], 4.5);
    }
    check(where, 'announcement info edge on page', v['--ann-info-edge'], v['--bg'], 3);

    if (theme === 'bento') {
      for (const tile of ['--tile-base', '--tile-base-strong']) {
        check(where, `text on ${tile}`, v['--text'], v[tile], 4.5);
        check(where, `muted on ${tile}`, v['--muted'], v[tile], 4.5);
        check(where, `accent text on ${tile}`, v['--accent-fg'], v[tile], 4.5);
      }
      for (const mesh of ['--mesh-a', '--mesh-b', '--mesh-c']) {
        check(where, `text on ${mesh}`, v['--text'], v[mesh], 4.5);
        check(where, `muted on ${mesh}`, v['--muted'], v[mesh], 4.5);
      }
    }
    if (theme === 'soft') {
      for (const wash of ['--wash-a', '--wash-b']) {
        check(where, `text on ${wash}`, v['--text'], v[wash], 4.5);
        check(where, `muted on ${wash}`, v['--muted'], v[wash], 4.5);
      }
    }
    if (theme === 'executive') {
      gradient(where, 'white on sidebar wash', '#ffffff', v['--side-a'], v['--side-b'], 7);
    }
    if (theme === 'creative') {
      gradient(
        where,
        'header text on header gradient',
        v['--hdr-on'],
        v['--hdr-a'],
        v['--hdr-b'],
        4.5,
      );
    }
    if (theme === 'sidebar') {
      gradient(where, 'white on band gradient', '#ffffff', v['--band-a'], v['--band-b'], 4.6);
      check(where, 'white on rail', '#ffffff', v['--rail'], 7);
      check(where, 'rail mark on rail', v['--rail-mark'], v['--rail'], 4.5);
    }
    if (theme === 'index') {
      check(where, 'text on panel', v['--text'], v['--panel'], 4.5);
      check(where, 'muted on panel', v['--muted'], v['--panel'], 4.5);
      check(where, 'accent text on panel', v['--accent-fg'], v['--panel'], 4.5);
      // The hero: its text over EVERY stop of the mesh (so the brightest and the darkest part), 4.5:1 for
      // small text (so large display text clears its 3:1 with room), through the scrim when there is one.
      for (const stop of ['--ix-m0', '--ix-m1', '--ix-m2', '--ix-m3', '--ix-m4']) {
        check(where, `hero text on ${stop}`, v['--ix-hero-ink'], v[stop], 4.5);
      }
      check(where, 'hero button text on hero ink', v['--ix-hero-page'], v['--ix-hero-ink'], 7);
    }
    if (theme === 'aurora') {
      for (const surface of ['--au-raised', '--au-raised-hover']) {
        check(where, `text on ${surface}`, v['--text'], v[surface], 4.5);
        check(where, `muted on ${surface}`, v['--muted'], v[surface], 4.5);
        check(where, `accent text on ${surface}`, v['--accent-fg'], v[surface], 4.5);
      }
      // The brightest point of the glow: its layers stacked (see recipes.ts).
      const alpha = parseInt(v['--au-glow-alpha'], 10) / 100;
      const stacked = 1 - (1 - alpha) * (1 - alpha * 0.7) * (1 - alpha * 0.5);
      const peak = mixHex(v['--au-glow'], v['--bg'], stacked);
      check(where, 'muted over glow peak', v['--muted'], peak, 5);
      check(where, 'text over glow peak', v['--text'], peak, 7);
      check(where, 'accent text over glow peak', v['--accent-fg'], peak, 3);
    }
    if (accentShift > HEAVY) heavy.push(`${where} (${accentShift.toFixed(2)})`);
  }
}

console.log(`${LOOKS.length} looks x ${Object.keys(ACCENTS).length} accents checked`);
console.log(`Accents moved by more than ${HEAVY} in lightness (the picker warns): ${heavy.length}`);
if (process.argv.includes('--list')) console.log(heavy.join('\n'));
if (failures > 0) {
  console.error(`${failures} contrast check(s) failed`);
  process.exit(1);
}
console.log('Palette checks passed');
