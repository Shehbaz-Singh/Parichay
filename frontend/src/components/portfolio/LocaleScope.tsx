import type { ReactNode } from 'react';
import { languageOf } from '@parichay/shared';
import { uiFor } from '@/lib/i18n';
import { localeFontClass } from '@/lib/locale-fonts';
import { atkinson } from '@/lib/reading-font';
import { HtmlLang } from './HtmlLang';
import { PrePaintScript } from './PrePaintScript';
import { LanguageSwitcher, type LanguageLink } from './LanguageSwitcher';
import { ReadingPreferences } from './ReadingPreferences';

// Everything on a portfolio page in one language: its lang and direction (so screen readers, hyphenation
// and the browser's text handling are right, and RTL layouts mirror through logical CSS properties),
// the script's font, the strip above the theme with the reading preferences button and, when the
// profile has other languages, the links to them.
//
// `data-reading` marks where the visitor's reading preferences apply (app/reading-prefs.css). The
// small script sets them on <html> before the page is painted; it is the only place that does, so
// the dashboard never has them.
export async function LocaleScope({
  locale,
  links,
  label,
  bare = false,
  children,
}: {
  locale: string;
  links: LanguageLink[]; // empty: no switcher
  label: string; // "Language"
  // A multi-page portfolio has the language links and the reading preferences in its own navigation,
  // so it has no strip above the theme.
  bare?: boolean;
  children: ReactNode;
}) {
  const language = languageOf(locale);
  const fontClass = await localeFontClass(locale);
  return (
    <div
      lang={language.code}
      dir={language.dir}
      data-script={language.script}
      data-reading=""
      className={`${fontClass} ${atkinson.variable}`}
    >
      <PrePaintScript />
      <HtmlLang lang={language.code} dir={language.dir} />
      {!bare && (
        <div className="brand border-b border-[#d8cdbd] bg-[#f4ede2] px-4 py-1.5 text-sm text-[#1f1a17]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {links.length > 1 && (
              <LanguageSwitcher links={links} current={language.code} label={label} />
            )}
            <ReadingPreferences ui={uiFor(language.code).reading} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
