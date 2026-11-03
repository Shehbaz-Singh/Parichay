import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PublicProfile } from '@parichay/shared';
import { pagePath, uiFor } from '@/lib/i18n';
import { loadThemeFonts } from '@/lib/theme-loader';
import { getTheme } from '@/lib/themes';
import { SampleBanner } from '../SampleBanner';
import { SiteNav, type NavPage } from '../portfolio/SiteNav';
import { pageSplit } from '../themes/blocks';
import { ThemeWrapper } from '../themes/ThemeWrapper';

// The frame of the Writing pages (the list and a single post): the owner's theme colors and accent,
// a way back to their portfolio, and the content. It is the reading layout, not a full theme: the
// five themes only draw the portfolio page itself. The contact form's own page uses it too.
export async function WritingShell({
  profile,
  allPosts = true,
  current,
  children,
}: {
  profile: PublicProfile;
  allPosts?: boolean; // the link to the list of posts (the Writing pages); off for other pages
  current?: NavPage; // the page it is, to mark in the navigation of a profile that has one
  children: ReactNode;
}) {
  const theme = getTheme(profile.theme).key;
  const fonts = await loadThemeFonts(theme);
  const ui = uiFor(profile.locale);
  const base = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  // `.wr-display` marks headings that use the theme's display face. Creative has none of its own (its
  // body font is the display font), so there it changes nothing.
  const split = current !== undefined && pageSplit(profile).split;
  const display =
    theme === 'creative' ? '' : '[&_.wr-display]:font-(family-name:--font-theme-display)';
  return (
    <ThemeWrapper
      theme={theme}
      profile={profile}
      nav={split ? <SiteNav profile={profile} current={current} /> : undefined}
      className={`${fonts} ${display}`}
    >
      {profile.isSample && <SampleBanner ui={ui.sample} />}
      {!split && (
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <Link
              href={base}
              className="min-w-0 truncate font-semibold text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg"
            >
              {profile.fullName}
            </Link>
            {allPosts && (
              <Link
                href={`${base}/writing`}
                className="shrink-0 text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg"
              >
                {ui.writing.all}
              </Link>
            )}
          </div>
        </header>
      )}
      <main id="main" className="mx-auto max-w-3xl px-5 py-10 text-ink sm:px-8 sm:py-14">
        {children}
      </main>
    </ThemeWrapper>
  );
}
