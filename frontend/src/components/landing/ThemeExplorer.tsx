'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ThemeKey } from '@parichay/shared';
import { FEATURED_SAMPLE_SLUG, SAMPLE_BY_THEME } from '@/lib/landing-sample';
import { loadTheme } from '@/lib/theme-loader';
import type { ThemeComponent } from '../themes/types';
import { Skeleton } from '../ui';
import { cx } from '../ui/cx';

const THEMES: { key: ThemeKey; name: string }[] = [
  { key: 'editorial', name: 'Editorial' },
  { key: 'bento', name: 'Bento' },
  { key: 'soft', name: 'Soft' },
  { key: 'executive', name: 'Executive' },
  { key: 'creative', name: 'Creative' },
  { key: 'sidebar', name: 'Sidebar' },
];

// "Original" is the sample's own accent; the rest are offered on top of it.
const ACCENTS = [
  { name: 'Terracotta', hex: '#b4492b' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Green', hex: '#15803d' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Rose', hex: '#e11d48' },
];

// The page is drawn at a desktop width, or a narrower one on a phone (so a theme shows its tablet
// layout instead of an unreadable speck), then scaled to fit the box.
const WIDE = 1280;
const NARROW = 820;
const RATIO = 0.62; // height of the box as a share of its width

// A real theme drawing the example profile, shown shrunk. The theme code is a separate chunk,
// loaded once the page has arrived so it does not hold up the first paint; until it is there, and
// without JavaScript, a screenshot of the same example stands in. The preview is decoration for
// people who can see it, so it is hidden from assistive technology and cannot be focused or
// clicked: the buttons around it are the interface, and a line announces what changed.
export function ThemeExplorer({
  idPrefix,
  withAccents = false,
}: {
  idPrefix: string;
  withAccents?: boolean;
}) {
  const [theme, setTheme] = useState<ThemeKey>('editorial');
  const [accent, setAccent] = useState<string | null>(null); // null: the sample's own
  const [hover, setHover] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<ThemeComponent | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let current = true;
    loadTheme(theme).then((Theme) => {
      if (current) setLoaded(() => Theme);
    });
    return () => {
      current = false;
    };
  }, [theme]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sample = SAMPLE_BY_THEME[theme];
  const shown = hover ?? accent ?? sample.accentColor;
  const page = width >= 700 ? WIDE : NARROW;
  const scale = width / page;
  const themeName = THEMES.find((t) => t.key === theme)?.name;
  const accentName = accent ? ACCENTS.find((a) => a.hex === accent)?.name : 'original';
  const Theme = loaded;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <div role="group" aria-label="Theme" className="flex flex-wrap justify-center gap-1.5">
          {THEMES.map(({ key, name }) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === theme}
              onClick={() => setTheme(key)}
              className={cx(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                key === theme
                  ? 'border-ink bg-ink text-page'
                  : 'border-line bg-page hover:border-ink/50',
              )}
            >
              {name}
            </button>
          ))}
        </div>
        {withAccents && (
          <div role="group" aria-label="Accent color" className="flex items-center gap-2">
            <span aria-hidden="true" className="text-sm text-muted">
              Accent
            </span>
            {[{ name: 'Original', hex: null }, ...ACCENTS].map(({ name, hex }) => (
              <button
                key={name}
                type="button"
                aria-pressed={hex === accent}
                aria-label={name}
                onClick={() => setAccent(hex)}
                onMouseEnter={() => setHover(hex ?? sample.accentColor)}
                onMouseLeave={() => setHover(null)}
                className={cx(
                  'size-7 rounded-full border-2 transition',
                  hex === accent ? 'border-ink' : 'border-transparent hover:border-ink/40',
                )}
                style={{
                  backgroundColor: hex ?? sample.accentColor,
                  boxShadow: 'inset 0 0 0 2px var(--bg)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <figure className="mt-6">
        <div className="overflow-hidden rounded-card border border-line bg-page shadow-overlay">
          <div
            aria-hidden="true"
            className="flex gap-1.5 border-b border-line bg-surface px-4 py-3"
          >
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="ms-3 truncate rounded-full bg-page px-3 text-xs leading-5 text-muted">
              yoursite.com/{sample.slug}
            </span>
          </div>
          <div
            ref={box}
            aria-hidden="true"
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: `1 / ${RATIO}` }}
          >
            {!Theme && <Skeleton className="absolute inset-0 rounded-none" />}
            {Theme && width > 0 && (
              <div
                inert
                style={{
                  width: page,
                  height: (width * RATIO) / scale,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}
              >
                <Theme profile={{ ...sample, accentColor: shown }} idPrefix={`${idPrefix}-`} />
              </div>
            )}
          </div>
        </div>
        <noscript>
          <p className="mt-3 text-sm text-muted">
            The live preview needs JavaScript.{' '}
            <Link href={`/${FEATURED_SAMPLE_SLUG}`} className="underline">
              See an example page
            </Link>
            .
          </p>
        </noscript>
        <figcaption className="mt-3 text-center text-sm text-muted" aria-live="polite">
          {sample.fullName}, {sample.location} · {themeName} theme
          {withAccents ? `, ${accentName} accent` : ''}. A made-up sample profile.{' '}
          <Link href={`/${sample.slug}`} className="font-medium text-accent-fg underline">
            Open the full page
            <span className="sr-only"> of {sample.fullName}</span>
          </Link>
        </figcaption>
      </figure>
    </div>
  );
}
