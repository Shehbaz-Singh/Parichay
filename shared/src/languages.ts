// The languages a portfolio can be offered in. This is the one place that lists them: the
// dashboard, the public routes, the fonts and the sitemap all read it.

// Scripts the fonts are chosen by (frontend/src/lib/locale-fonts.ts maps each to a font).
export const SCRIPTS = [
  'latin',
  'devanagari',
  'telugu',
  'tamil',
  'bengali',
  'gujarati',
  'gurmukhi',
  'arabic',
  'nastaliq',
] as const;
export type Script = (typeof SCRIPTS)[number];

export interface Language {
  code: string; // BCP 47
  name: string; // in English
  nativeName: string; // in its own script, for the language switcher
  script: Script; // picks the font; "nastaliq" is Urdu's traditional style
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'latin', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'devanagari', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'telugu', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'tamil', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'bengali', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'devanagari', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'gujarati', dir: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'gurmukhi', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'nastaliq', dir: 'rtl' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', script: 'latin', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', script: 'latin', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', script: 'latin', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', script: 'latin', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', script: 'arabic', dir: 'rtl' },
] as const satisfies readonly Language[];

export type LocaleCode = (typeof LANGUAGES)[number]['code'];
export const LOCALE_CODES = LANGUAGES.map((language) => language.code) as unknown as readonly [
  LocaleCode,
  ...LocaleCode[],
];

export const DEFAULT_LOCALE: LocaleCode = 'en';
// Languages a profile can add besides its default one.
export const MAX_EXTRA_LANGUAGES = 4;
export const isLocaleCode = (value: string): value is LocaleCode =>
  (LOCALE_CODES as readonly string[]).includes(value);

export const languageOf = (code: string): Language =>
  LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
