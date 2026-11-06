import {
  announcementState,
  type AnnouncementState,
  type AnnouncementStyle,
  type MyProfile,
  type PublicAnnouncement,
} from '@parichay/shared';
import { offsetMinutes, zonedFields } from './work-time';

// What the dashboard needs for the announcement bar: the owner's time zone for dates, the schedule in plain
// words, and the bar as the live preview draws it. The dates are stored as UTC instants; the zone is only
// for showing and typing them here.

// The zone the owner's dates are written in: the one on the Working together card, else the browser's.
export function ownerZone(profile: Pick<MyProfile, 'timezone'>): string {
  if (profile.timezone) return profile.timezone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const two = (n: number) => String(n).padStart(2, '0');

// An instant as the value of a datetime-local input, on the clock of `zone` ("2026-12-12T09:00").
export function toLocalInput(iso: string | null, zone: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const f = zonedFields(date, zone);
  return `${f.year}-${two(f.month)}-${two(f.day)}T${two(f.hour)}:${two(f.minute)}`;
}

// What a datetime-local input holds, read as a time on the clock of `zone`: the instant it means, as an ISO
// string, or null when the field is empty or not a date. The zone's offset can differ between the guess and
// the answer (a change of daylight saving between them), so it is asked twice.
export function fromLocalInput(value: string, zone: string): string | null {
  const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(value);
  if (!m) return null;
  const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const first = offsetMinutes(new Date(wall), zone);
  let instant = wall - first * 60000;
  const second = offsetMinutes(new Date(instant), zone);
  if (second !== first) instant = wall - second * 60000;
  const date = new Date(instant);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// "12 Dec, 9:00 am", on the clock of `zone`; the year only when it is not this one.
export function whenText(iso: string, zone: string, now = new Date()): string {
  const date = new Date(iso);
  const sameYear = zonedFields(date, zone).year === zonedFields(now, zone).year;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(/\bam\b/i, 'am')
    .replace(/\bpm\b/i, 'pm');
}

// "IST", "GMT+1": the zone's short name at that moment, so a summary says which clock it means.
export function zoneName(zone: string, at: Date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'short' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? zone;
  } catch {
    return zone;
  }
}

interface Schedule {
  startsAt: string | null;
  endsAt: string | null;
}

// "Shows 12 Dec, 9:00 am to 20 Dec, 6:00 pm IST": the schedule as the owner has typed it, in plain words.
export function scheduleSummary({ startsAt, endsAt }: Schedule, zone: string, now = new Date()) {
  const name = zoneName(zone, new Date(startsAt ?? endsAt ?? now));
  if (startsAt && endsAt) {
    return `Shows ${whenText(startsAt, zone, now)} to ${whenText(endsAt, zone, now)} ${name}`;
  }
  if (startsAt)
    return `Shows from ${whenText(startsAt, zone, now)} ${name}, until you switch it off`;
  if (endsAt) return `Shows now until ${whenText(endsAt, zone, now)} ${name}`;
  return 'Shows as soon as you save it, until you switch it off';
}

// The state of the saved announcement in plain words, for the card and the extras list.
export function stateText(
  profile: Pick<
    MyProfile,
    | 'announcementEnabled'
    | 'announcementText'
    | 'announcementStartsAt'
    | 'announcementEndsAt'
    | 'timezone'
  >,
  now = new Date(),
): { state: AnnouncementState; text: string } {
  const state = announcementState(profile, now);
  const zone = ownerZone(profile);
  const at = (iso: string | null) =>
    iso ? `${whenText(iso, zone, now)} ${zoneName(zone, new Date(iso))}` : '';
  switch (state) {
    case 'scheduled':
      return { state, text: `Scheduled for ${at(profile.announcementStartsAt)}` };
    case 'live':
      return {
        state,
        text: profile.announcementEndsAt
          ? `Showing now until ${at(profile.announcementEndsAt)}`
          : 'Showing now',
      };
    case 'ended':
      return { state, text: `Ended on ${at(profile.announcementEndsAt)}` };
    default:
      return { state, text: 'Not showing' };
  }
}

interface Draft {
  enabled: boolean;
  text: string;
  linkUrl: string | null;
  linkLabel: string | null;
  style: AnnouncementStyle;
  dismissible: boolean;
  scroll: boolean;
  version: number;
}

// The bar as the preview draws it: whatever is typed, as soon as it is on and has words. The dates do not
// hide it here, so the owner sees what they are scheduling.
export function previewAnnouncement(d: Draft): PublicAnnouncement | undefined {
  const text = d.text.trim();
  if (!d.enabled || !text) return undefined;
  return {
    text,
    linkUrl: d.linkUrl,
    linkLabel: d.linkUrl ? d.linkLabel : null,
    style: d.style,
    dismissible: d.dismissible,
    scroll: d.scroll,
    version: d.version,
    endsAt: null,
  };
}

// The saved announcement as the preview draws it when nothing is being edited: only while it is live,
// like the public page.
export function savedAnnouncement(
  profile: MyProfile,
  now = new Date(),
): PublicAnnouncement | undefined {
  if (announcementState(profile, now) !== 'live') return undefined;
  return previewAnnouncement({
    enabled: true,
    text: profile.announcementText ?? '',
    linkUrl: profile.announcementLinkUrl,
    linkLabel: profile.announcementLinkLabel,
    style: profile.announcementStyle,
    dismissible: profile.announcementDismissible,
    scroll: profile.announcementScroll,
    version: profile.announcementVersion,
  });
}
