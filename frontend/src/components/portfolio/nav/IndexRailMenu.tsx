'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { focusRing, WIDE } from '@/components/themes/tokens';

// The Index theme's navigation: a slim white rail down the left (the right in a right-to-left language)
// from 900px up, a top bar with a menu button below. One element does both: the bar is always there on a
// phone, and the rest (numbered links, the secondary links, language and reading preferences) is the rail
// itself above 900px and a full-height panel when the button opens it. The panel traps Tab, closes with
// Escape or a link and gives focus back to the button. 
//
// `pages` mode (a multi-page portfolio): real links, the current page marked with aria-current="page".
// `sections` mode (the single page): links to the sections' headings; the one being read is marked
// aria-current="location", and a click moves focus to the heading.

export interface IndexRailItem {
  key: string;
  href: string;
  label: string;
  number: string; // "01"
}

export interface IndexRailText {
  nav: string;
  menu: string;
  close: string;
  skip: string;
}

export function IndexRailMenu({
  name,
  homeHref,
  items,
  mode,
  current,
  text,
  mainId,
  secondary,
  children,
}: {
  name: string;
  homeHref: string;
  items: IndexRailItem[];
  mode: 'pages' | 'sections';
  current?: string;
  text: IndexRailText;
  mainId: string;
  secondary?: ReactNode; // Download resume, Contact: under the divider
  children?: ReactNode; // language links and reading preferences
}) {
  const root = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [here, setHere] = useState('');

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
      let found = '';
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
    rootEl
      ?.querySelector<HTMLElement>(`#${CSS.escape(panelId)} a, #${CSS.escape(panelId)} button`)
      ?.focus();
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

  const onSection = (item: IndexRailItem) => {
    // The browser scrolls to the heading; focus goes there too (the headings have tabindex="-1").
    const target = document.getElementById(item.href.slice(1));
    setHere(item.key);
    setOpen(false);
    if (target) requestAnimationFrame(() => target.focus({ preventScroll: true }));
  };

  const linkClass = `inline-flex min-h-11 max-w-full items-center py-1 text-[0.9375rem] min-[900px]:min-h-8 leading-snug font-medium text-ink [overflow-wrap:anywhere] hover:underline hover:underline-offset-6 ${focusRing}`;

  return (
    <header
      ref={root}
      data-sitenav=""
      className={`ix-rail relative z-40 border-b border-line bg-page text-ink print:hidden min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-dvh min-[900px]:w-[13.75rem] min-[900px]:shrink-0 min-[900px]:overflow-y-auto min-[900px]:overscroll-contain min-[900px]:border-e min-[900px]:border-b-0 ${
        open
          ? 'max-[899px]:fixed max-[899px]:inset-0 max-[899px]:h-dvh max-[899px]:overflow-y-auto'
          : 'max-[899px]:sticky max-[899px]:top-0'
      }`}
    >
      <noscript>
        <style>{`.ix-panel-wrap{display:flex!important}.ix-toggle{display:none!important}.ix-rail{position:static!important}`}</style>
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
          className={`min-w-0 line-clamp-2 text-base leading-tight font-semibold [overflow-wrap:anywhere] ${focusRing}`}
        >
          {name}
        </Link>
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close(true) : setOpen(true))}
          className={`ix-toggle inline-flex min-h-11 shrink-0 items-center gap-2 border border-line px-3.5 text-[0.9375rem] font-medium ${focusRing}`}
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
        className={`ix-panel-wrap flex-col gap-7 px-5 pt-5 pb-10 min-[900px]:flex min-[900px]:min-h-full min-[900px]:px-6 min-[900px]:py-8 ${
          open ? 'flex' : 'hidden'
        }`}
      >
        <Link
          href={homeHref}
          className={`hidden text-[1.0625rem] leading-tight font-semibold [overflow-wrap:anywhere] min-[900px]:block ${focusRing}`}
        >
          {name}
        </Link>

        <nav aria-label={text.nav} className="ix-nav">
          <ol>
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
              const label = (
                <span>
                  {item.label}
                  <sup
                    aria-hidden="true"
                    className="ms-1 text-[0.8125rem] font-normal tabular-nums"
                  >
                    {item.number}
                  </sup>
                </span>
              );
              return (
                <li key={item.key}>
                  {mode === 'pages' ? (
                    <Link href={item.href} {...props} onClick={() => setOpen(false)}>
                      {label}
                    </Link>
                  ) : (
                    <a href={item.href} {...props} onClick={() => onSection(item)}>
                      {label}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {secondary && (
          <div className="flex flex-col gap-1 border-t border-line pt-5 text-[0.9375rem] text-muted">
            {secondary}
          </div>
        )}
        {children && (
          <div className="mt-auto flex flex-col items-start gap-3 text-[0.875rem]">{children}</div>
        )}
      </div>
    </header>
  );
}
