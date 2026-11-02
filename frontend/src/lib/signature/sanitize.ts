import { languageOf, type Script } from '@parichay/shared';

// Everything the signature prints passes through here first. The signature is HTML the owner pastes
// into other people's mail, so a name or a role must never be able to add markup.

const isUnsafe = (code: number) =>
  code <= 0x1f ||
  (code >= 0x7f && code <= 0x9f) ||
  code === 0x061c ||
  code === 0x200e ||
  code === 0x200f ||
  code === 0x2028 ||
  code === 0x2029 ||
  (code >= 0x202a && code <= 0x202e) ||
  code === 0x2060 ||
  (code >= 0x2066 && code <= 0x2069) ||
  code === 0xfeff;

export function cleanText(value: string | null | undefined): string {
  return Array.from(value ?? '', (c) => (isUnsafe(c.codePointAt(0)!) ? ' ' : c))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cut at `max` characters as a reader counts them (a letter with its marks is one), adding an
// ellipsis when something was cut.
export function clip(text: string, max: number): string {
  const pieces: string[] =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? Array.from(
          new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
          (s) => s.segment,
        )
      : Array.from(text);
  if (pieces.length <= max) return text;
  return `${pieces
    .slice(0, max - 1)
    .join('')
    .trimEnd()}…`;
}

export const text = (value: string | null | undefined, max: number) => clip(cleanText(value), max);

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ENTITIES[c]);

// An absolute http(s) address without a login in it, or null. Nothing is added to it.
export function webUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

// Only an https address can be used: mail apps load http images badly or not at all.
export const httpsUrl = (value: string | null | undefined): URL | null => {
  const url = webUrl(value);
  return url?.protocol === 'https:' ? url : null;
};

export const EMAIL = /^[^\s@<>"'?&,;:()[\]\\]+@[^\s@<>"'?&,;:()[\]\\]+\.[^\s@<>"'?&,;:()[\]\\]+$/;

// A phone number for a tel: link: digits and a leading plus only.
export function dialable(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return /^\+?\d{5,20}$/.test(digits) ? digits : null;
}

// ---- Language and direction of a piece of text

type Range = readonly [number, number];
const SCRIPT_RANGES: [Script, Range[]][] = [
  ['devanagari', [[0x0900, 0x097f]]],
  ['bengali', [[0x0980, 0x09ff]]],
  ['gurmukhi', [[0x0a00, 0x0a7f]]],
  ['gujarati', [[0x0a80, 0x0aff]]],
  ['tamil', [[0x0b80, 0x0bff]]],
  ['telugu', [[0x0c00, 0x0c7f]]],
  [
    'arabic',
    [
      [0x0600, 0x06ff],
      [0x0750, 0x077f],
      [0x08a0, 0x08ff],
      [0xfb50, 0xfdff],
      [0xfe70, 0xfeff],
    ],
  ],
];
const RTL_RANGES: Range[] = [
  [0x0590, 0x08ff],
  [0xfb1d, 0xfdff],
  [0xfe70, 0xfeff],
];

const hasAny = (value: string, ranges: readonly Range[]) =>
  Array.from(value).some((c) => {
    const code = c.codePointAt(0)!;
    return ranges.some(([lo, hi]) => code >= lo && code <= hi);
  });

// The language of a text, as the `lang` attribute wants it, or null for plain Latin text in the
// default language. A script is matched to the chosen language when that language uses it (Marathi
// for Devanagari, Urdu for Arabic letters), otherwise to the usual one for the script.
const USUAL: Partial<Record<Script, string>> = {
  devanagari: 'hi',
  bengali: 'bn',
  gurmukhi: 'pa',
  gujarati: 'gu',
  tamil: 'ta',
  telugu: 'te',
  arabic: 'ar',
};

export function languageOfText(value: string, locale: string): string | null {
  const found = SCRIPT_RANGES.find(([, ranges]) => hasAny(value, ranges));
  const chosen = languageOf(locale);
  if (!found) return chosen.script === 'latin' && chosen.code !== 'en' ? chosen.code : null;
  const script = found[0];
  const matches = chosen.script === script || (script === 'arabic' && chosen.script === 'nastaliq');
  return matches ? chosen.code : (USUAL[script] ?? null);
}

export const isRtlText = (value: string) => hasAny(value, RTL_RANGES);
