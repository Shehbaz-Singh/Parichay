import { createHmac, randomBytes } from 'node:crypto';

// Counts what one visitor sends, without keeping anything that identifies them. The visitor is a
// keyed hash of their address, and the key is a random secret that is made when the server starts
// and replaced at the start of every UTC day, so a hash cannot be matched to an address afterwards
// (nor to the same visitor on another day). The counters live in memory only: nothing is written to
// the database or to a log, and everything is forgotten when the server restarts, which on the free
// tier happens whenever it sleeps. That is why the per-profile cap and the retention sweep rely on
// the database instead, and this is only the first line against a single script.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MAX_ENTRIES = 20_000; // a flood of addresses cannot grow the map without bound

interface Entry {
  hourStart: number;
  count: number; // in the current hour
  dayCount: number; // today (the map is emptied at midnight UTC)
}

export function createVisitorLimiter(
  perHour: number,
  perDay: number,
  now: () => number = Date.now,
) {
  let secret = randomBytes(32);
  let day = Math.floor(now() / DAY);
  const entries = new Map<string, Entry>();

  const rotate = (today: number) => {
    if (today === day) return;
    secret = randomBytes(32);
    day = today;
    entries.clear();
  };

  const prune = (time: number) => {
    for (const [key, entry] of entries) if (entry.hourStart + HOUR <= time) entries.delete(key);
  };

  // true while the visitor is under both limits. Every call that gets true counts as one message.
  return function allow(address: string): boolean {
    const time = now();
    rotate(Math.floor(time / DAY));
    const key = createHmac('sha256', secret).update(address).digest('base64url');

    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= MAX_ENTRIES) prune(time);
      // Still full of recent visitors: refuse new ones rather than grow.
      if (entries.size >= MAX_ENTRIES) return false;
      entry = { hourStart: time, count: 0, dayCount: 0 };
      entries.set(key, entry);
    }
    if (entry.hourStart + HOUR <= time) {
      entry.hourStart = time;
      entry.count = 0;
    }
    if (entry.count >= perHour || entry.dayCount >= perDay) return false;
    entry.count += 1;
    entry.dayCount += 1;
    return true;
  };
}
