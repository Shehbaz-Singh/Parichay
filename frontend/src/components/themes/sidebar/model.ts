import { languageOf, type PublicProfile } from '@parichay/shared';
import { translatorFor } from '@/lib/i18n';
import type { HeaderModel } from '../blocks';

// What the Sidebar theme works out from a profile beyond the shared blocks: the numbers of the About
// section, its facts and its one quote. Only real data is used. A number that cannot be computed is left
// out, never replaced by an invented one.

const DAY = 86_400_000;
const YEAR = 365.25 * DAY;
// A quote on the dark panel is shown whole or not at all: a cut quote misquotes.
const QUOTE_MAX = 240;

// How much work the jobs add up to, in milliseconds. Overlapping jobs count once (the stretches are merged).
function workedMs(profile: Pick<PublicProfile, 'experience'>, now: number): number {
  const spans = profile.experience
    .map((job) => [Date.parse(job.startDate), job.endDate ? Date.parse(job.endDate) : now] as const)
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [from, to] = spans[0] ?? [0, 0];
  for (const [start, end] of spans.slice(1)) {
    if (start <= to) to = Math.max(to, end);
    else {
      total += to - from;
      [from, to] = [start, end];
    }
  }
  return total + (to - from);
}

// Whole years of work. Under a year there is nothing to show as a number of years, so it is null.
export function experienceYears(
  profile: Pick<PublicProfile, 'experience'>,
  now = Date.now(),
): number | null {
  const years = Math.floor(workedMs(profile, now) / YEAR);
  return years >= 1 ? years : null;
}

// Whole months of work, for someone early in their career (null under a month).
function experienceMonths(
  profile: Pick<PublicProfile, 'experience'>,
  now = Date.now(),
): number | null {
  const months = Math.floor(workedMs(profile, now) / (YEAR / 12));
  return months >= 1 ? months : null;
}

export interface AboutExtras {
  stats: { value: number; label: string }[];
  facts: { label: string; value: string; href?: string }[];
  quote: { message: string; name: string; detail: string | null } | null;
}

export function aboutExtras(profile: PublicProfile, header: HeaderModel): AboutExtras {
  const ui = header.ui;
  const t = translatorFor(profile.locale);
  const stats: AboutExtras['stats'] = [];
  // Work experience leads. The number of projects is only shown next to it, never in its place.
  const years = experienceYears(profile);
  const months = years ? null : experienceMonths(profile);
  if (years) stats.push({ value: years, label: t('sidebar.statYears', { count: years }) });
  else if (months) stats.push({ value: months, label: t('sidebar.statMonths', { count: months }) });
  if (stats.length > 0 && profile.projects.length > 0) {
    stats.push({
      value: profile.projects.length,
      label: t('sidebar.statProjects', { count: profile.projects.length }),
    });
  }

  const facts: AboutExtras['facts'] = [];
  if (header.location) facts.push({ label: ui.pages.factLocation, value: header.location });
  if (profile.locales.length > 0) {
    const codes = [profile.defaultLocale, ...profile.locales];
    facts.push({
      label: ui.sidebar.factLanguages,
      value: codes.map((code) => languageOf(code).nativeName).join(', '),
    });
  }
  if (header.availability) {
    facts.push({ label: ui.pages.factAvailability, value: header.availability.label });
  }
  // Email and phone only when the owner shows them as links.
  for (const link of header.links) {
    if (link.type === 'email') {
      facts.push({ label: ui.sidebar.factEmail, value: link.label, href: link.href });
    }
    if (link.type === 'phone') {
      facts.push({ label: ui.sidebar.factPhone, value: link.label, href: link.href });
    }
  }

  const pick = profile.testimonials.find((item) => item.message.trim().length <= QUOTE_MAX);
  return {
    stats,
    facts,
    quote: pick
      ? {
          message: pick.message.trim(),
          name: pick.authorName,
          detail: [pick.authorRole, pick.authorCompany].filter(Boolean).join(', ') || null,
        }
      : null,
  };
}

// The tagline split into the role and the rest ("Product Designer" | " based in London"), so the role can
// be set in italics. Only split at a plain separator; a tagline without one is left whole.
export function splitTagline(tagline: string): [string, string] {
  const match = /^(.+?)(\s+(?:based in|at|in|for|·|\||–|—|-)\s+.*|,\s.*)$/i.exec(tagline);
  return match ? [match[1], match[2]] : [tagline, ''];
}
