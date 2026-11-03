'use client';

import { useSyncExternalStore } from 'react';
import { PRE_PAINT_SCRIPT } from '@/lib/reading-prefs';

const subscribe = () => () => {};

// The script that sets the visitor's reading preferences before the page is painted. It is only drawn
// on the server and while the page hydrates (the snapshot is `true` there); when the visitor moves to
// another page without a reload, React renders it on the client, where a script never runs and React
// warns about it, so it is left out (ReadingPreferences applies the choices after navigation anyway).
export function PrePaintScript() {
  const first = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  return first ? <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} /> : null;
}
