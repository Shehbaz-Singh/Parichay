// A visitor's reading preferences for the public pages. They live in this browser only: one
// localStorage entry, no cookie, nothing sent anywhere. The choices are data attributes on <html>
// (read by app/reading-prefs.css), set by a tiny script before the first paint and by the store below
// afterwards. Without JavaScript, or without storage, the page is simply shown as the theme made it.

export const STORAGE_KEY = 'parichay:reading-prefs';

// The values besides the default, per setting. The default is "not set": no attribute at all.
export const CHOICES = {
  text: ['larger', 'largest'],
  font: ['plain', 'atkinson'],
  lines: ['relaxed'],
  motion: ['reduce'],
} as const;

export type Setting = keyof typeof CHOICES;
export type Prefs = { [S in Setting]?: (typeof CHOICES)[S][number] };

const SETTINGS = Object.keys(CHOICES) as Setting[];
const attribute = (setting: Setting) => `data-read-${setting}`;

// Only known values get through, so a hand-edited or old entry can set nothing else.
export function parsePrefs(raw: string | null): Prefs {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    const found: Record<string, unknown> =
      typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
    const prefs: Prefs = {};
    for (const setting of SETTINGS) {
      const value = found[setting];
      if ((CHOICES[setting] as readonly unknown[]).includes(value)) {
        (prefs as Record<string, unknown>)[setting] = value;
      }
    }
    return prefs;
  } catch {
    return {};
  }
}

// Also marks a device that should get the plain variant of the visual effects (data-fx="low": no ambient
// animation, no blur, solid fills): Save-Data, little memory, few cores or a request for less data.
// Runs in the head of the page's body before anything after it is painted. Built from CHOICES so it
// cannot drift from the code above. Everything is in a try: storage may be blocked.
export const PRE_PAINT_SCRIPT = `(function(){try{var c=${JSON.stringify(CHOICES)},p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||'{}'),h=document.documentElement;for(var k in c)if(c[k].indexOf(p[k])>-1)h.setAttribute('data-read-'+k,p[k])}catch(e){}try{var n=navigator,o=n.connection,l=document.documentElement;if((o&&o.saveData)||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2)||matchMedia('(prefers-reduced-data: reduce)').matches)l.setAttribute('data-fx','low')}catch(e){}})()`;

export function applyPrefs(prefs: Prefs) {
  const html = document.documentElement;
  for (const setting of SETTINGS) {
    const value = prefs[setting];
    if (value) html.setAttribute(attribute(setting), value);
    else html.removeAttribute(attribute(setting));
  }
}

export function clearPrefs() {
  for (const setting of SETTINGS) document.documentElement.removeAttribute(attribute(setting));
}

// ---- the store (for useSyncExternalStore)

let memory: string | null = null; // what was chosen when storage cannot be written
let cachedRaw: string | null | undefined;
let cached: Prefs = {};
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    // Writing can fail while reading works (some private modes), so the choice made this visit wins.
    return localStorage.getItem(STORAGE_KEY) ?? memory;
  } catch {
    return memory;
  }
}

// The same object until the stored text changes, as useSyncExternalStore needs.
export function getPrefs(): Prefs {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parsePrefs(raw);
  }
  return cached;
}

// The same object every time: useSyncExternalStore compares snapshots by identity.
const NO_PREFS: Prefs = Object.freeze({});
export const getServerPrefs = (): Prefs => NO_PREFS;

const changed = () => listeners.forEach((listener) => listener());

export function subscribePrefs(listener: () => void) {
  listeners.add(listener);
  // Another tab changed them.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    applyPrefs(getPrefs());
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function write(prefs: Prefs) {
  const empty = SETTINGS.every((setting) => !prefs[setting]);
  memory = empty ? null : JSON.stringify(prefs);
  try {
    if (memory === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, memory);
  } catch {
    // No storage: the choice still applies to this visit.
  }
  applyPrefs(prefs);
  changed();
}

export function setPref<S extends Setting>(setting: S, value: Prefs[S]) {
  const next: Prefs = { ...getPrefs() };
  if (value) (next as Record<string, unknown>)[setting] = value;
  else delete next[setting];
  write(next);
}

export const resetPrefs = () => write({});
