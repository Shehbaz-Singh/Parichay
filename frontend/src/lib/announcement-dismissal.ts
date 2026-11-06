// A visitor closing the announcement bar. The choice lives in this browser tab only, for the length of the
// visit: one sessionStorage entry per portfolio, no cookie, nothing sent to the server. It survives a reload
// and moving between the pages of the portfolio, and it is gone when the tab is closed, so reopening the
// page shows the bar again. The entry says which version of the announcement was
// closed, so a changed announcement (a new version) shows again even within the visit. Without storage, or with it blocked, the
// bar is hidden for the rest of the visit from memory, and comes back with the next page load.
//
// Portfolios share one origin, so the key carries the profile's address. It is the same on every page and
// in every language of that portfolio, so one click closes it everywhere for the visit.

export const dismissalKey = (slug: string) => `parichay:announcement:${slug}`;

interface Saved {
  version: number;
  dismissedAt: string;
}

const memory = new Map<string, number>();
const listeners = new Set<() => void>();

function readSaved(slug: string): number | null {
  try {
    const raw = window.sessionStorage.getItem(dismissalKey(slug));
    if (raw) {
      const saved: unknown = JSON.parse(raw);
      if (typeof saved === 'object' && saved !== null && 'version' in saved) {
        const { version } = saved as Partial<Saved>;
        if (typeof version === 'number') return version;
      }
    }
  } catch {
    // blocked or unreadable storage: the memory below still answers
  }
  return memory.get(slug) ?? null;
}

// True when this very version was closed on this device.
export const isDismissed = (slug: string, version: number) => readSaved(slug) === version;

export function dismiss(slug: string, version: number) {
  memory.set(slug, version);
  try {
    const saved: Saved = { version, dismissedAt: new Date().toISOString() };
    window.sessionStorage.setItem(dismissalKey(slug), JSON.stringify(saved));
  } catch {
    // the memory above holds it for this visit
  }
  listeners.forEach((listener) => listener());
}

// For useSyncExternalStore: this tab's own closings, and closings in other tabs of the same portfolio.
export function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

// The script that hides the bar before the first paint, so a visitor who closed it never sees it flash.
// It sits right after the bar in the HTML (the bar is its previous sibling) and also takes down a bar whose
// end has passed in a page that was cached a moment ago. Everything is in a try: storage may be blocked.
export function prePaintScript(slug: string, version: number, endsAt: string | null) {
  return `(function(){try{var s=document.currentScript,b=s&&s.previousElementSibling;if(!b)return;var e=${JSON.stringify(endsAt)};if(e&&Date.parse(e)<=Date.now()){b.hidden=true;return}var d=JSON.parse(sessionStorage.getItem(${JSON.stringify(dismissalKey(slug))})||'null');if(d&&d.version===${Number(version)})b.hidden=true}catch(x){}})()`;
}
