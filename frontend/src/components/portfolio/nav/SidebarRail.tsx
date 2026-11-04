'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

// The Sidebar theme's navigation: a dark rail down the left (the right in RTL) from 900px up, a slim bar
// with a menu button below. One element does both: the bar is always there on a phone, and the rest (the
// links, the social icons, the language links and reading preferences) is the rail itself above 900px
// and a full-height panel when the button opens it. The panel traps Tab, closes with Escape or a link
// and gives focus back to the button. Without JavaScript the panel is simply shown under the bar.
//
// `pages` mode (a multi-page portfolio): real links, the current page marked with aria-current="page".
// `sections` mode (the single page): links to the sections' headings; the one being read is marked
// aria-current="location", found by what is at the top of the screen, and a click moves focus to the
// heading so the keyboard and a screen reader land where the page scrolled to.

export interface RailItem {
  key: string;
  href: string;
  label: string;
}

export interface RailText {
  nav: string;
  menu: string;
  close: string;
  skip: string;
}

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const display = 'font-(family-name:--font-theme-display)';
const WIDE = '(min-width: 900px)';

export function SidebarRail({
  logo,
  homeHref,
  items,
  mode,
  current,
  text,
  mainId,
  children,
  footer,
}: {
  logo: string;
  homeHref: string;
  items: RailItem[];
  mode: 'pages' | 'sections';
  current?: string; // pages mode: the key of the page being shown
  text: RailText;
  mainId: string;
  children?: ReactNode; // under the links: social icons, language links, reading preferences
  footer?: ReactNode; // the quiet last line
}) {
  const root = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [here, setHere] = useState(items[0]?.key ?? '');

  const close = useCallback((giveFocusBack: boolean) => {
    setOpen(false);
    if (giveFocusBack) button.current?.focus();
  }, []);

  // A new page closes the menu.
  useEffect(() => setOpen(false), [pathname]);

  // The section being read: the last one whose heading has reached the upper third of the screen.
  useEffect(() => {
    if (mode !== 'sections') return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let found = items[0]?.key ?? '';
      for (const item of items) {
        const target = document.getElementById(item.href.slice(1));
        if (target && target.getBoundingClientRect().top <= window.innerHeight * 0.3) {
          found = item.key;
        }
      }
      setHere(found);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items, mode]);

  // While the panel is open: Escape closes it, Tab stays inside it, the page behind does not scroll, and
  // widening the window to the rail's layout closes it.
  useEffect(() => {
    if (!open) return;
    const rootEl = root.current;
    const first = rootEl?.querySelector<HTMLElement>(
      `#${CSS.escape(panelId)} a, #${CSS.escape(panelId)} button`,
    );
    first?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== 'Tab' || !rootEl) return;
      const focusable = [
        ...rootEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const start = focusable[0];
      const end = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === start || !rootEl.contains(active))) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && (active === end || !rootEl.contains(active))) {
        event.preventDefault();
        start.focus();
      }
    };
    const query = window.matchMedia(WIDE);
    const onWide = () => query.matches && close(false);
    document.addEventListener('keydown', onKey);
    query.addEventListener('change', onWide);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      query.removeEventListener('change', onWide);
    };
  }, [open, close, panelId]);

  const onSection = (item: RailItem) => {
    // The browser scrolls to the heading; focus goes there too (the headings have tabindex="-1").
    const target = document.getElementById(item.href.slice(1));
    setHere(item.key);
    setOpen(false);
    if (target) requestAnimationFrame(() => target.focus({ preventScroll: true }));
  };

  const linkClass = `relative flex min-h-10 items-center py-2 ps-4 pe-2 pt-small text-muted [overflow-wrap:anywhere] before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:bg-(--rail-mark) before:opacity-0 hover:text-ink aria-[current]:font-bold aria-[current]:text-ink aria-[current]:before:opacity-100 ${focusRing}`;

  return (
    <header
      ref={root}
      data-sitenav=""
      className={`sb-rail relative z-40 print:hidden min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-dvh min-[900px]:w-60 min-[900px]:shrink-0 min-[900px]:overflow-y-auto min-[900px]:overscroll-contain ${
        open
          ? 'max-[899px]:fixed max-[899px]:inset-0 max-[899px]:h-dvh max-[899px]:overflow-y-auto'
          : ''
      }`}
    >
      <noscript>
        <style>{`.sb-panel{display:flex!important}.sb-toggle{display:none!important}.sb-rail{position:static!important}`}</style>
      </noscript>
      <a
        href={`#${mainId}`}
        className={`sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:bg-page focus:px-4 focus:py-2 focus:font-semibold focus:text-ink ${focusRing}`}
      >
        {text.skip}
      </a>

      <div className="flex min-h-14 items-center justify-between gap-3 px-5 min-[900px]:hidden">
        <Link
          href={homeHref}
          className={`${display} min-w-0 pt-h3 font-bold [overflow-wrap:anywhere] line-clamp-2 ${focusRing}`}
        >
          {logo}
        </Link>
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close(true) : setOpen(true))}
          className={`sb-toggle inline-flex min-h-11 shrink-0 items-center gap-2 border border-line px-3.5 text-sm font-semibold ${focusRing}`}
        >
          {open ? (
            <X aria-hidden="true" className="size-4" />
          ) : (
            <Menu aria-hidden="true" className="size-4" />
          )}
          {open ? text.close : text.menu}
        </button>
      </div>

      <div
        id={panelId}
        className={`sb-panel flex-col gap-8 px-6 pt-4 pb-8 min-[900px]:flex min-[900px]:min-h-full min-[900px]:py-8 ${
          open ? 'flex' : 'hidden'
        }`}
      >
        <Link
          href={homeHref}
          className={`${display} hidden pt-h2 font-bold [overflow-wrap:anywhere] min-[900px]:block ${focusRing}`}
        >
          {logo}
        </Link>

        <nav aria-label={text.nav}>
          <ul>
            {items.map((item) => {
              const active = mode === 'pages' ? item.key === current : item.key === here;
              const props = {
                'aria-current': active
                  ? mode === 'pages'
                    ? ('page' as const)
                    : ('location' as const)
                  : undefined,
                className: linkClass,
              };
              return (
                <li key={item.key}>
                  {mode === 'pages' ? (
                    <Link href={item.href} {...props} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} {...props} onClick={() => onSection(item)}>
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-5">
          {children}
          {footer}
        </div>
      </div>
    </header>
  );
}
