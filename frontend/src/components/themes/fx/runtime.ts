import { animate, inView } from 'motion';

// The motion of the public themes, for what CSS cannot do. Loaded on demand by FxLoader.
//
// The system (the same for every theme; a theme picks its character with CSS variables on its wrapper):
//   durations   150 / 200 / 250 / 300 ms     --fx-duration is one of them, per theme; never above 300
//   easing      ease-out for entrances (below), ease-in-out for movement, a spring for small controls
//   distance    --fx-distance, in px: 0 means a fade only
//   stagger     none: items that enter together enter together
//   only transform and opacity are animated; nothing runs twice; nothing waits for the visitor.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const number = (value: string, fallback: number) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function start({ reveal }: { reveal: boolean }): () => void {
  const stops: (() => void)[] = [];
  const root = document.querySelector<HTMLElement>('[data-portfolio]');
  if (!root) return () => {};
  const style = getComputedStyle(root);
  const duration = number(style.getPropertyValue('--fx-duration'), 400) / 1000;
  const distance = number(style.getPropertyValue('--fx-distance'), 12);

  if (reveal) {
    // Sections, and the items a theme marks, that are below the fold now: hidden here (not in the HTML, so
    // without JavaScript everything shows) and shown once as they come into view.
    const targets = root.querySelectorAll<HTMLElement>(
      'main section[aria-labelledby]:not(.au-hero), .fx-item',
    );
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.style.opacity = '0';
      if (distance) el.style.transform = `translateY(${distance}px)`;
      const stop = inView(
        el,
        () => {
          animate(el, { opacity: 1, transform: 'none' }, { duration, ease: EASE_OUT }).then(
            () => {
              el.style.opacity = '';
              el.style.transform = '';
            },
          );
          stop();
        },
        { amount: 0.12 },
      );
      stops.push(stop);
    });
  }

  return () => stops.forEach((stop) => stop());
}
