import Link from 'next/link';
import type { PublicProfile } from '@parichay/shared';
import { pagePath, uiFor } from '@/lib/i18n';
import { findPage, pageHref, pageLabel } from '@/lib/pages';
import { focusRing } from '@/components/themes/tokens';

// The pieces of a project page that every theme's template shares: its breadcrumbs, and the way back
// (the themes draw the rest in their own templates, components/themes/templates/).

// ---- breadcrumbs

export interface Crumb {
  label: string;
  href?: string; // the last one is the page itself and has none
}

// Home > Work > Project. A nav landmark of its own; the page itself is marked aria-current.
export function Breadcrumbs({ crumbs, label }: { crumbs: Crumb[]; label: string }) {
  return (
    <nav aria-label={label} className="mb-6 text-sm text-muted print:hidden">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((crumb, index) => (
          <li key={crumb.label + index} className="flex min-w-0 items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="rtl:-scale-x-100">
                ›
              </span>
            )}
            {crumb.href ? (
              <Link href={crumb.href} className={`hover:underline ${focusRing}`}>
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink [overflow-wrap:anywhere]">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---- a project

type Project = PublicProfile['projects'][number];

// The crumbs and the back link of a project page, in either mode: with a Work page the way back is the
// list of work, without one it is the projects of the single page.
export function projectTrail(profile: PublicProfile, project: Project) {
  const ui = uiFor(profile.locale);
  const home = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const work = findPage(profile, 'work');
  const projectsTitle =
    profile.sections.find((section) => section.key === 'projects')?.title ?? ui.sections.projects;
  const back = work
    ? { label: pageLabel(profile, work), href: pageHref(profile, work) }
    : { label: projectsTitle, href: `${home}#projects` };
  return {
    home,
    back,
    crumbs: [
      { label: ui.pages.home, href: home },
      { label: back.label, href: back.href },
      { label: project.name },
    ] satisfies Crumb[],
  };
}
