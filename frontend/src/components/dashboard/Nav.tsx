'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { useEffect, useId, useState, type MouseEvent } from 'react';
import {
  ChevronDown,
  House,
  Inbox,
  Languages,
  LayoutList,
  LayoutPanelTop,
  LogOut,
  Menu,
  MessageSquareQuote,
  Palette,
  Settings,
  Share2,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/client-api';
import { Badge, Button, Sheet } from '../ui';
import { cx } from '../ui/cx';
import { useEditor } from './editor-context';
import { useMessages } from './messages-context';
import { useGo, useLeaveGuard } from './navigation';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  // Other pages that belong under this one, so it stays marked as the current page on them.
  also?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// The dashboard's pages, in a few labeled groups. Home stands alone above them.
const HOME: NavItem = { href: '/dashboard', label: 'Home', Icon: House };
const GROUPS: NavGroup[] = [
  {
    label: 'Build',
    items: [{ href: '/dashboard/profile', label: 'Profile', Icon: UserRound }],
  },
  {
    label: 'Look',
    items: [
      { href: '/dashboard/themes', label: 'Themes', Icon: Palette },
      { href: '/dashboard/pages', label: 'Pages', Icon: LayoutPanelTop },
      { href: '/dashboard/sections', label: 'Sections', Icon: LayoutList },
      { href: '/dashboard/languages', label: 'Languages', Icon: Languages },
    ],
  },
  {
    label: 'Share',
    items: [
      {
        href: '/dashboard/extras',
        label: 'Share & extras',
        Icon: Share2,
        also: ['/dashboard/link-bio', '/dashboard/signature'],
      },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { href: '/dashboard/messages', label: 'Messages', Icon: Inbox },
      { href: '/dashboard/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
    ],
  },
  {
    label: 'Account',
    items: [{ href: '/dashboard/settings', label: 'Settings', Icon: Settings }],
  },
];

const isCurrent = (pathname: string, item: NavItem) =>
  pathname === item.href || (item.also ?? []).some((p) => pathname === p);

// What waits on a page: unread messages and pending testimonials. A badge is only for these (things
// asking to be looked at), never for how far along the profile is.
function useAttention(): Record<string, { count: number; word: string } | undefined> {
  const { profile } = useEditor();
  const { unread } = useMessages();
  const pending = profile.testimonials.filter((t) => t.status === 'pending').length;
  return {
    '/dashboard/messages': unread > 0 ? { count: unread, word: 'unread' } : undefined,
    '/dashboard/testimonials': pending > 0 ? { count: pending, word: 'pending' } : undefined,
  };
}

export function useAttentionTotal() {
  return Object.values(useAttention()).reduce((sum, a) => sum + (a?.count ?? 0), 0);
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const go = useGo();
  const attention = useAttention()[item.href];
  const current = isCurrent(pathname, item);

  // A plain click goes through the leave check; opening in a new tab or window is left alone.
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate?.();
    void go(item.href);
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      className={cx(
        'relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition motion-reduce:transition-none',
        current
          ? 'bg-accent-soft font-semibold text-ink before:absolute before:inset-y-1.5 before:start-0 before:w-1 before:rounded-full before:bg-accent'
          : 'text-muted hover:bg-surface hover:text-ink active:bg-line',
      )}
    >
      <item.Icon aria-hidden="true" className="size-5 shrink-0" />
      <span>{item.label}</span>
      {attention && (
        <Badge tone="solid" className="ms-auto">
          {attention.count}
          <span className="sr-only"> {attention.word}</span>
        </Badge>
      )}
    </Link>
  );
}

// The groups. On a wide screen every group is open under its label. In the drawer each one folds
// under its label, and the one holding the current page starts open.
function NavGroups({ collapsible, onNavigate }: { collapsible: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const base = useId();
  const [closed, setClosed] = useState<Set<string>>(
    () =>
      new Set(
        GROUPS.filter((g) => !g.items.some((item) => isCurrent(pathname, item))).map(
          (g) => g.label,
        ),
      ),
  );
  const toggle = (label: string) =>
    setClosed((before) => {
      const next = new Set(before);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  return (
    <div className="space-y-4">
      <ul>
        <li>
          <NavLink item={HOME} onNavigate={onNavigate} />
        </li>
      </ul>
      {GROUPS.map((group) => {
        const open = !collapsible || !closed.has(group.label);
        const listId = `${base}-${group.label}`;
        return (
          <div key={group.label}>
            {collapsible ? (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() => toggle(group.label)}
                className="flex w-full items-center justify-between rounded-control px-3 py-1.5 text-xs font-semibold tracking-wide text-muted uppercase hover:bg-surface"
              >
                {group.label}
                <ChevronDown
                  aria-hidden="true"
                  className={cx(
                    'size-4 transition-transform motion-reduce:transition-none',
                    open && 'rotate-180',
                  )}
                />
              </button>
            ) : (
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                {group.label}
              </p>
            )}
            <ul id={listId} hidden={!open} className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
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

// Wide screens: a sidebar.
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between overflow-y-auto border-e border-line p-4 lg:flex">
      <div className="space-y-6">
        <p className="px-3 pt-1">
          <Logo />
        </p>
        <nav aria-label="Dashboard">
          <NavGroups collapsible={false} />
        </nav>
      </div>
      <LogOutButton className="mt-4 w-full justify-start" />
    </aside>
  );
}

// Narrow screens: a menu button in the top bar that opens the same pages in a drawer.
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const attention = useAttentionTotal();

  // The drawer closes when the page changes (a link inside it, or the leave check letting you go).
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="relative -ms-2 inline-flex size-10 items-center justify-center rounded-control hover:bg-surface active:bg-line lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
        <span className="sr-only">
          Menu
          {attention > 0 ? `, ${attention} item${attention === 1 ? '' : 's'} need attention` : ''}
        </span>
        {attention > 0 && (
          <span
            aria-hidden="true"
            className="absolute end-1.5 top-1.5 size-2.5 rounded-full bg-accent"
          />
        )}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Menu" side="start">
        <nav aria-label="Dashboard menu" className="flex min-h-full flex-col justify-between gap-6">
          <NavGroups collapsible onNavigate={() => setOpen(false)} />
          <LogOutButton className="w-full justify-start" />
        </nav>
      </Sheet>
    </>
  );
}
