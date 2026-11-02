'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import type { MouseEvent } from 'react';
import {
  Inbox,
  Languages,
  Link2,
  LayoutList,
  LogOut,
  Mail,
  MessageSquareQuote,
  Palette,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/client-api';
import { Badge, Button } from '../ui';
import { cx } from '../ui/cx';
import { completeness } from './Completeness';
import { useEditor } from './editor-context';
import { useMessages } from './messages-context';
import { useGo, useLeaveGuard } from './navigation';

// The dashboard's pages. Analytics is not here because the app has none.
const ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Profile', Icon: UserRound },
  { href: '/dashboard/sections', label: 'Sections', Icon: LayoutList },
  { href: '/dashboard/languages', label: 'Languages', Icon: Languages },
  { href: '/dashboard/themes', label: 'Themes', Icon: Palette },
  { href: '/dashboard/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
  { href: '/dashboard/messages', label: 'Messages', Icon: Inbox },
  { href: '/dashboard/link-bio', label: 'Link-in-bio', Icon: Link2 },
  { href: '/dashboard/signature', label: 'Signature', Icon: Mail },
  { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
];

// What shows beside a label: the share of the profile that is filled in, testimonials waiting, or
// unread messages.
function useHints(): Record<string, string | undefined> {
  const { profile } = useEditor();
  const { unread } = useMessages();
  const pending = profile.testimonials.filter((t) => t.status === 'pending').length;
  return {
    '/dashboard': `${completeness(profile).percent}%`,
    '/dashboard/testimonials': pending > 0 ? String(pending) : undefined,
    '/dashboard/messages': unread > 0 ? String(unread) : undefined,
  };
}

// The word a screen reader hears after the number, for the pages that have one.
const HINT_WORDS: Record<string, string> = {
  '/dashboard': ' complete',
  '/dashboard/testimonials': ' pending',
  '/dashboard/messages': ' unread',
};

function NavLinks({ layout }: { layout: 'side' | 'bottom' }) {
  const pathname = usePathname();
  const go = useGo();
  const hints = useHints();

  // A plain click goes through the leave check; opening in a new tab or window is left alone.
  function onClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void go(href);
  }

  return (
    <ul className={layout === 'side' ? 'space-y-1' : 'flex overflow-x-auto'}>
      {ITEMS.map(({ href, label, Icon }) => {
        const current = pathname === href;
        const hint = hints[href];
        return (
          <li key={href} className={layout === 'bottom' ? 'min-w-fit flex-1' : undefined}>
            <Link
              href={href}
              onClick={(e) => onClick(e, href)}
              aria-current={current ? 'page' : undefined}
              className={cx(
                'flex items-center rounded-control text-sm font-medium transition',
                layout === 'side'
                  ? 'gap-3 px-3 py-2'
                  : 'min-h-14 flex-col justify-center gap-0.5 px-0.5 text-[0.6875rem]',
                current
                  ? 'bg-accent-soft font-semibold text-ink'
                  : 'text-muted hover:bg-surface hover:text-ink active:bg-line',
              )}
            >
              <span className="relative">
                <Icon aria-hidden="true" className="size-5" />
                {layout === 'bottom' && hint && href !== '/dashboard' && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1.5 size-2.5 rounded-full bg-accent"
                  />
                )}
              </span>
              <span>{label}</span>
              {layout === 'side' && hint && (
                <Badge tone={href === '/dashboard' ? 'neutral' : 'solid'} className="ms-auto">
                  {hint}
                  <span className="sr-only">{HINT_WORDS[href]}</span>
                </Badge>
              )}
              {layout === 'bottom' && hint && href !== '/dashboard' && (
                <span className="sr-only">
                  {hint}
                  {HINT_WORDS[href]}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function LogOutButton({ className }: { className?: string }) {
  const canLeave = useLeaveGuard();
  async function logOut() {
    if (!(await canLeave())) return;
    await api('/auth/logout', { method: 'POST', redirectOn401: false }).catch(() => {});
    window.location.assign('/login'); // a full load, so no profile data lingers in memory
  }
  return (
    <Button variant="ghost" onClick={logOut} className={className}>
      <LogOut aria-hidden="true" className="size-4" />
      Log out
    </Button>
  );
}

// Wide screens: a sidebar. Narrow ones: a bar along the bottom.
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-e border-line p-4 lg:flex">
      <div className="space-y-6">
        <p className="px-3 pt-1">
          <Logo />
        </p>
        <nav aria-label="Dashboard">
          <NavLinks layout="side" />
        </nav>
      </div>
      <LogOutButton className="w-full justify-start" />
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page lg:hidden"
    >
      <NavLinks layout="bottom" />
    </nav>
  );
}
