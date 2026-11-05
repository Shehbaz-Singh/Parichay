'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { focusRing, WIDE } from '@/components/themes/tokens';

// The Aurora theme's navigation: a slim bar pinned to the top, the name or monogram on the left, the
// pages in the middle and one action on the right (with the language links and reading preferences next
// to it). Below 900px the links and the extras go behind a menu button: the panel traps Tab, closes with
// Escape or a link, and gives focus back to the button. Without JavaScript the panel is simply shown
// under the bar, so every link is still there.
//
// `pages` mode (a multi-page portfolio): real links, the current page marked with aria-current="page".
// `sections` mode (the single page): links to the sections' headings; the one being read is marked
// aria-current="location", and a click moves focus to the heading so the keyboard and a screen reader
// land where the page scrolled to.

export interface BarItem {
  key: string;
  href: string;
  label: string;
}

export interface BarText {
  nav: string;
  menu: string;
  close: string;
  skip: string;
}

export interface BarAction {
  href: string;
  label: string;
  download?: boolean;
}

export function AuroraBarView({
  logo,
  homeHref,
  items,
  mode,
  current,
  text,
  mainId,
  action,
  children,
}: {
  logo: string;
  homeHref: string;
  items: BarItem[];
  mode: 'pages' | 'sections';
  current?: string;
  text: BarText;
  mainId: string;
  action: BarAction | null;
  children?: ReactNode; // language links and reading preferences
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

  useEffect(() => setOpen(false), [pathname]);

  // The section being read: the last whose heading has reached the upper third of the screen.
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

  // While the menu is open: Escape closes it, Tab stays inside the bar, and widening the window closes it.
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

  const onSection = (item: BarItem) => {
    const target = document.getElementById(item.href.slice(1));
    setHere(item.key);
    setOpen(false);
    if (target) requestAnimationFrame(() => target.focus({ preventScroll: true }));
  };

  const linkClass = `relative flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium text-muted hover:text-ink aria-[current]:bg-surface aria-[current]:text-ink min-[900px]:min-h-9 ${focusRing}`;
  const actionClass = `inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:opacity-90 min-[900px]:min-h-10 ${focusRing}`;

  const renderLink = (item: BarItem) => {
    const active = mode === 'pages' ? item.key === current : item.key === here;
    const props = {
      'aria-current': active
        ? mode === 'pages'
          ? ('page' as const)
          : ('location' as const)
        : undefined,
      className: linkClass,
    };
    return mode === 'pages' ? (
      <Link href={item.href} {...props} onClick={() => setOpen(false)}>
        {item.label}
      </Link>
    ) : (
      <a href={item.href} {...props} onClick={() => onSection(item)}>
        {item.label}
      </a>
    );
  };

  const renderAction = (className: string) =>
    action &&
    (action.download ? (
      <a href={action.href} className={className}>
        {action.label}
      </a>
    ) : (
      <Link href={action.href} onClick={() => setOpen(false)} className={className}>
        {action.label}
      </Link>
    ));

  return (
    <header
      ref={root}
      data-sitenav=""
      data-open={open ? '' : undefined}
      className={`au-bar sticky top-0 z-40 border-b border-line fx-blur print:hidden ${
        open
          ? 'max-[899px]:fixed max-[899px]:inset-0 max-[899px]:h-dvh max-[899px]:overflow-y-auto'
          : ''
      }`}
    >
      <noscript>
        <style>{`.au-panel{display:flex!important}.au-toggle{display:none!important}.au-bar{position:static!important}`}</style>
      </noscript>
      <a
        href={`#${mainId}`}
        className={`sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-on-accent ${focusRing}`}
      >
        {text.skip}
      </a>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-[clamp(1rem,4vw,2rem)] min-[900px]:grid min-[900px]:grid-cols-[1fr_auto_1fr]">
        <Link
          href={homeHref}
          className={`line-clamp-1 min-w-0 rounded-md text-base font-bold tracking-tight [overflow-wrap:anywhere] ${focusRing}`}
        >
          {logo}
        </Link>
        <nav aria-label={text.nav} className="hidden min-[900px]:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.key}>{renderLink(item)}</li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <div className="hidden items-center gap-2 text-sm min-[900px]:flex">{children}</div>
          {renderAction(`${actionClass} hidden min-[900px]:inline-flex`)}
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => (open ? close(true) : setOpen(true))}
            className={`au-toggle inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold min-[900px]:hidden ${focusRing}`}
          >
            {open ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <Menu aria-hidden="true" className="size-4" />
            )}
            {open ? text.close : text.menu}
          </button>
        </div>
      </div>

      <div
        id={panelId}
        className={`au-panel flex-col gap-6 px-[clamp(1rem,4vw,2rem)] pt-2 pb-8 min-[900px]:hidden ${
          open ? 'flex' : 'hidden'
        }`}
      >
        <nav aria-label={text.nav}>
          <ul>
            {items.map((item) => (
              <li key={item.key}>{renderLink(item)}</li>
            ))}
          </ul>
        </nav>
        {renderAction(actionClass)}
        <div className="flex flex-wrap items-center gap-3 text-sm">{children}</div>
      </div>
    </header>
  );
}
