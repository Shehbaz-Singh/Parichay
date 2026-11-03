import Link from 'next/link';
import type { PublicProfile } from '@parichay/shared';
import { pageSplit } from '@/components/themes/blocks';
import { pagePath, uiFor } from '@/lib/i18n';

export type NavPage = 'home' | 'work' | 'about' | 'writing';

// The slim, sticky navigation of a profile that is split into pages (see pageSplit). A profile that
// is one page has none. It names the pages with the owner's own section headings. The current page
// is underlined and marked aria-current, so it does not depend on color; the links are few enough to
// sit in one row on a phone, so there is no menu to open.
export function SiteNav({
  profile,
  current,
  always = false,
}: {
  profile: PublicProfile;
  current: NavPage;
  always?: boolean; // a single-page profile has none, except on a page that needs a way back (a project)
}) {
  const pages = pageSplit(profile);
  if (!pages.split && !always) return null;

  const ui = uiFor(profile.locale);
  const base = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const title = (key: 'projects' | 'about' | 'writing') =>
    profile.sections.find((section) => section.key === key)?.title ??
    (key === 'writing' ? ui.writing.title : ui.sections[key]);

  const items = [
    pages.work && { page: 'work' as const, href: `${base}/work`, label: title('projects') },
    pages.about && { page: 'about' as const, href: `${base}/about`, label: title('about') },
    pages.writing && { page: 'writing' as const, href: `${base}/writing`, label: title('writing') },
  ].filter((item) => !!item);

  const mark = (page: NavPage) => (current === page ? ('page' as const) : undefined);
  const link =
    'inline-flex min-h-6 items-center border-b-2 border-transparent py-1 hover:border-ink aria-[current=page]:border-ink aria-[current=page]:font-semibold';

  return (
    <div
      data-sitenav=""
      className="sticky top-0 z-30 border-b border-line bg-page text-ink print:hidden"
    >
      <nav
        aria-label={ui.density.pages}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2 text-sm sm:px-8"
      >
        <Link href={base} aria-current={mark('home')} className={`${link} min-w-0 truncate`}>
          {profile.fullName}
        </Link>
        <ul className="flex flex-wrap gap-x-5">
          {items.map((item) => (
            <li key={item.page}>
              <Link href={item.href} aria-current={mark(item.page)} className={link}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
