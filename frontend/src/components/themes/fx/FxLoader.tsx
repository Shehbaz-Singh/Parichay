'use client';

import { useEffect } from 'react';

// Starts the one thing CSS cannot do everywhere: scroll reveals in a browser without scroll-driven
// animations. Almost nothing is loaded here: in a browser that does the reveals in CSS (see
// theme-fx.css), no JavaScript is fetched at all. Otherwise ./runtime is loaded after hydration, with the `motion` library in a chunk of its own, so
// neither ever enters the shared bundle. Nothing is loaded for a visitor who asked for less motion, on a
// device marked plain (data-fx="low", set before paint by lib/reading-prefs), or when the page is
// printed. Content is visible without any of this; it only adds the entrances.
export function FxLoader() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.fx === 'low') return;
    const calm =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      root.dataset.readMotion === 'reduce';
    if (calm) return;
    // Aurora's glow drifts slowly; it stands still while it is off screen.
    const glow = document.querySelector<HTMLElement>('.au-hero');
    const watcher =
      glow && 'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => {
            glow.toggleAttribute('data-offscreen', !entry.isIntersecting);
          })
        : null;
    if (glow) watcher?.observe(glow);
    const reveal = !CSS.supports('animation-timeline: view()');
    if (!reveal) return () => watcher?.disconnect();
    let stop: (() => void) | undefined;
    let gone = false;
    import('./runtime').then((runtime) => {
      if (!gone) stop = runtime.start({ reveal });
    });
    return () => {
      watcher?.disconnect();
      gone = true;
      stop?.();
    };
  }, []);
  return null;
}
