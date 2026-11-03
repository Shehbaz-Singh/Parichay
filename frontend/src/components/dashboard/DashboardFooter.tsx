import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { COPYRIGHT_START_YEAR, FEEDBACK_EMAIL, SITE_NAME, SOCIAL_LINKS } from '@/lib/site';

// The quiet footer at the end of every dashboard page (DashboardShell renders it, so a new page
// gets it without doing anything). A server component: the year is worked out on the server, so
// the markup is the same when it reaches the browser.

const LINK = 'inline-flex min-h-6 items-center hover:text-ink hover:underline';

const SOCIALS = [
  { label: 'GitHub', url: SOCIAL_LINKS.github },
  { label: 'LinkedIn', url: SOCIAL_LINKS.linkedin },
  { label: 'X', url: SOCIAL_LINKS.x },
  { label: 'Instagram', url: SOCIAL_LINKS.instagram },
].filter((s) => s.url);

// One labeled group of links in the row. The label is spoken, not shown: the links say enough.
function LinkGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-x-4">{children}</ul>
    </nav>
  );
}

export function DashboardFooter() {
  const year = new Date().getFullYear();
  const years =
    year > COPYRIGHT_START_YEAR ? `${COPYRIGHT_START_YEAR}–${year}` : `${COPYRIGHT_START_YEAR}`;

  return (
    // pb-20 below xl: the floating "See your page" button sits at the bottom corner there.
    <footer className="border-t border-line text-xs text-muted print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 pt-5 pb-20 xl:pb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Logo variant="footer" />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <LinkGroup label="Footer: product">
            <li>
              <Link href="/dashboard" className={LINK}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/#faq" className={LINK}>
                FAQ
              </Link>
            </li>
            {FEEDBACK_EMAIL && (
              <li>
                <a href={`mailto:${FEEDBACK_EMAIL}`} className={LINK}>
                  Send feedback
                </a>
              </li>
            )}
          </LinkGroup>
          <LinkGroup label="Footer: legal">
            <li>
              <Link href="/privacy" className={LINK}>
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={LINK}>
                Terms
              </Link>
            </li>
          </LinkGroup>
          <LinkGroup label="Footer: account">
            <li>
              <Link href="/dashboard/settings" className={LINK}>
                Settings
              </Link>
            </li>
            <li>
              <Link href="/dashboard/settings#data-heading" className={LINK}>
                Export my data
              </Link>
            </li>
          </LinkGroup>
          {SOCIALS.length > 0 && (
            <LinkGroup label="Footer: social">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </LinkGroup>
          )}
        </div>

        <p className="w-full">
          © {years} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
