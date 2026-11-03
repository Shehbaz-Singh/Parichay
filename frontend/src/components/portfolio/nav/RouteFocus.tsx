'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// After a client-side navigation between the pages of a portfolio, a visitor who is using the keyboard
// (or a screen reader) gets focus on the new page's main heading, so they hear where they are and the
// next Tab starts at the content. A mouse or touch visit is not interrupted: nothing is focused, nothing
// scrolls. The first load is left alone. The document title is updated by the page's own metadata.
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  const keyboard = useRef(false);

  useEffect(() => {
    const key = () => {
      keyboard.current = true;
    };
    const pointer = () => {
      keyboard.current = false;
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', pointer);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', pointer);
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!keyboard.current) return;
    const target =
      document.querySelector<HTMLElement>('main h1') ?? document.querySelector<HTMLElement>('main');
    if (!target) return;
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
