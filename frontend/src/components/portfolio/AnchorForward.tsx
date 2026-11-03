'use client';

import { useEffect } from 'react';

// Links to a section of the old single page (/<slug>#projects) still work after the owner switches to
// pages. A server never sees the part after the "#", so this small script looks at it: when the anchor
// is not on this Home page and the page it belongs to exists, it goes there. `location.replace`
// leaves no extra history entry, so the back button does not bounce. Without JavaScript the visitor
// simply stays on Home.
export function AnchorForward({ targets }: { targets: Record<string, string> }) {
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash || document.getElementById(hash)) return;
    const target = targets[hash];
    if (target) window.location.replace(target);
  }, [targets]);
  return null;
}
