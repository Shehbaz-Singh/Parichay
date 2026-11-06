'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { THEME_COMPONENTS } from '@/lib/theme-components';
import { THEME_LIST } from '@/lib/themes';
import { useEditor } from './editor-context';

// The small picture of a theme: the whole theme drawn with the profile, which is a lot of page to render for
// each of eight cards. It is drawn when its card comes near the screen, and kept from then on (so it still
// follows what is being edited). Before that it is an empty frame of the same size, so nothing jumps.
function ThemeShot({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const element = frame.current;
    if (!element || near) return;
    const watcher = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          watcher.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    watcher.observe(element);
    return () => watcher.disconnect();
  }, [near]);
  return (
    <div
      ref={frame}
      aria-hidden="true"
      inert
      className="pointer-events-none h-40 overflow-hidden rounded-control border border-line"
    >
      {near && <div style={{ zoom: 0.2 }}>{children}</div>}
    </div>
  );
}

// Radio cards bound to the form's `theme` field, one per registered theme. Each card shows the
// theme itself, drawn small with the profile being edited, so the choice is made by looking.
// Choosing one switches the live preview straight away (the form's draft carries the theme).
export function ThemePicker() {
  const { register } = useFormContext();
  const { preview } = useEditor();

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Theme</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_LIST.map((theme) => {
          const Theme = THEME_COMPONENTS[theme.key];
          return (
            <label
              key={theme.key}
              className="flex cursor-pointer flex-col gap-2 rounded-box border border-line p-2 transition hover:bg-surface has-[>input:checked]:border-accent has-[>input:checked]:ring-2 has-[>input:checked]:ring-accent has-[>input:focus-visible]:outline-2 has-[>input:focus-visible]:outline-offset-2 has-[>input:focus-visible]:outline-accent"
            >
              <input type="radio" value={theme.key} className="sr-only" {...register('theme')} />
              {/* A picture of the theme, not content: hidden from assistive technology, and inert so
                nothing in it can be clicked or focused. The ids get a prefix so they stay unique. */}
              <ThemeShot>
                <Theme profile={preview} idPrefix={`pick-${theme.key}-`} />
              </ThemeShot>
              <span className="relative bg-page px-1 pb-1">
                <span className="block text-sm font-medium">{theme.name}</span>
                <span className="block text-xs text-muted">{theme.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
