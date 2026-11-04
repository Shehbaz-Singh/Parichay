'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// The work strip: a horizontal row of project cards that scrolls with snap points, with Previous and Next
// buttons. Nothing moves by itself. Until the page has loaded (and without JavaScript, on a narrow screen
// and in print) the cards are the plain grid they were drawn as: the strip layout is only switched on by
// `data-enhanced`, which this component sets once it is running (see .au-strip in globals.css). The
// buttons are native and named, the arrow keys scroll the strip when focus is in it, and the arrows
// mirror in right-to-left languages.
export function Strip({
  label,
  prev,
  next,
  children,
}: {
  label: string; // the strip's name for assistive technology
  prev: string;
  next: string;
  children: ReactNode; // the <li> cards
}) {
  const id = useId();
  const list = useRef<HTMLUListElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = list.current;
    if (!el) return;
    const left = Math.abs(el.scrollLeft);
    setEdges({
      start: left <= 2,
      end: left + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    setEnhanced(true);
  }, []);

  useEffect(() => {
    const el = list.current;
    if (!enhanced || !el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [enhanced, measure]);

  // The strip is a scroll area the keyboard can reach: Tab lands on it and the arrow keys scroll it (set
  // here, not in the markup, because it only exists once the script has made the strip).
  useEffect(() => {
    const el = list.current;
    if (!enhanced || !el) return;
    el.tabIndex = 0;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const rtl = getComputedStyle(el).direction === 'rtl';
      event.preventDefault();
      stepRef.current((event.key === 'ArrowRight') !== rtl ? 1 : -1);
    };
    el.addEventListener('keydown', onKeyDown);
    return () => {
      el.removeEventListener('keydown', onKeyDown);
      el.removeAttribute('tabindex');
    };
  }, [enhanced]);

  const step = (direction: 1 | -1) => {
    const el = list.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    const calm =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.readMotion === 'reduce';
    el.scrollBy({
      left: direction * rtl * el.clientWidth * 0.8,
      behavior: calm ? 'auto' : 'smooth',
    });
  };

  const stepRef = useRef(step);
  stepRef.current = step;

  const canScroll = !(edges.start && edges.end);
  const button =
    'inline-flex size-11 items-center justify-center rounded-full border border-line hover:bg-surface disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
  return (
    <div>
      {enhanced && canScroll && (
        <div className="mb-4 hidden justify-end gap-2 sm:flex print:hidden">
          <button
            type="button"
            aria-controls={id}
            disabled={edges.start}
            onClick={() => step(-1)}
            className={button}
          >
            <ArrowLeft aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            <span className="sr-only">{prev}</span>
          </button>
          <button
            type="button"
            aria-controls={id}
            disabled={edges.end}
            onClick={() => step(1)}
            className={button}
          >
            <ArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            <span className="sr-only">{next}</span>
          </button>
        </div>
      )}
      <ul
        id={id}
        ref={list}
        data-enhanced={enhanced ? '' : undefined}
        aria-label={enhanced ? label : undefined}
        className="au-strip grid gap-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-fg sm:grid-cols-2 lg:grid-cols-3"
      >
        {children}
      </ul>
    </div>
  );
}
