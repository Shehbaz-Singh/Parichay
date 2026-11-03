'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import type { NavItem } from '@/lib/pages';

// On a phone the pages of a multi-page portfolio are a bar at the bottom of the screen, where a thumb
// reaches: up to three pages and "More". "More" opens a full-screen menu on the browser's own <dialog>:
// the page behind it is inert, Tab stays inside, Escape closes it, and focus goes back to the button.
// The menu lists every page (so nothing is hidden when there are many) and holds the language links and
// the reading preferences. The current page is marked with aria-current and a bar across its top and
// bold text, not by color alone. It is only drawn below `sm`; above, the theme's own navigation shows.

export interface MobileText {
  nav: string; // "Pages"
  more: string; // "More"
  menuTitle: string; // "All pages"
  close: string; // "Close menu"
}

export interface MobileStyles {
  bar: string; // the fixed bar
  item: string; // a page in it (and the More button)
  current: string; // added to the current page
  sheet: string; // the full-screen menu
  sheetLink: string; // a page in the menu
  sheetCurrent: string;
  close: string; // the close button
}

// Slots in the bar besides "More". More pages than this go to the menu (the current one always shows).
const BAR_PAGES = 3;

export function MobileBar({
  items,
  current,
  text,
  styles,
  children,
}: {
  items: NavItem[];
  current: string;
  text: MobileText;
  styles: MobileStyles;
  children?: ReactNode; // the language links and reading preferences, at the end of the menu
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  // The first pages, and the current one in the last slot when it is further down the list.
  const first = items.slice(0, BAR_PAGES);
  const here = items.find((item) => item.key === current);
  const shown =
    items.length <= BAR_PAGES || !here || first.includes(here)
      ? first
      : [...first.slice(0, BAR_PAGES - 1), here];

  const close = () => dialog.current?.close();

  // A new page closes the menu (a link to the page you are on does not change the path, so the links
  // close it themselves too).
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <nav
        aria-label={text.nav}
        className={`fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] sm:hidden print:hidden ${styles.bar}`}
      >
        <ul className="flex">
          {shown.map((item) => (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={item.key === current ? 'page' : undefined}
                title={item.label}
                className={`${styles.item} ${item.key === current ? styles.current : ''}`}
              >
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
          <li className="min-w-0 flex-1">
            <button
              ref={trigger}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => dialog.current?.showModal()}
              className={`${styles.item} w-full`}
            >
              <Menu aria-hidden="true" className="me-1.5 size-4 shrink-0" />
              <span className="truncate">{text.more}</span>
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onToggle={(event) => setOpen((event.currentTarget as HTMLDialogElement).open)}
        className={`fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto p-0 backdrop:bg-black/40 sm:hidden ${styles.sheet}`}
      >
        <div className="flex min-h-full flex-col px-6 pt-5 pb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-sm font-semibold">
              {text.menuTitle}
            </h2>
            <button type="button" onClick={close} className={styles.close}>
              <X aria-hidden="true" className="size-4" />
              {text.close}
            </button>
          </div>
          <ul className="mt-6 flex-1">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={item.key === current ? 'page' : undefined}
                  className={`${styles.sheetLink} ${item.key === current ? styles.sheetCurrent : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {children && (
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">{children}</div>
          )}
        </div>
      </dialog>
    </>
  );
}
