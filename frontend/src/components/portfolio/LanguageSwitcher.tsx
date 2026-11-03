import Link from 'next/link';
import { languageOf } from '@parichay/shared';

export interface LanguageLink {
  code: string;
  href: string;
}

// The languages of a portfolio, each named in its own script, as plain links: no cookie, no redirect
// by browser language, and the page you are on is marked with aria-current. It is a strip above the
// theme (the five themes have different headers), in the page's own colors so it reads the same on all.
// LocaleScope draws the strip around it, with the reading preferences button.
export function LanguageSwitcher({
  links,
  current,
  label,
  inNav = false,
}: {
  links: LanguageLink[];
  current: string;
  label: string;
  // In the navigation of a multi-page portfolio: the theme's own colors, and the current language is
  // underlined as well as bold, so it does not rely on color.
  inNav?: boolean;
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {links.map(({ code, href }) => {
          const language = languageOf(code);
          const active = code === current;
          return (
            <li key={code}>
              <Link
                href={href}
                lang={code}
                hrefLang={code}
                dir={language.dir}
                aria-current={active ? 'page' : undefined}
                className={
                  inNav
                    ? `inline-block min-h-6 rounded px-2 py-1 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-fg ${active ? 'font-semibold underline decoration-2' : 'hover:underline'}`
                    : `inline-block rounded px-2.5 py-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9e3d21] ${active ? 'bg-[#1f1a17] font-semibold text-[#fbf7f0]' : 'text-[#7f301a] underline underline-offset-2 hover:no-underline'}`
                }
              >
                {language.nativeName}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
