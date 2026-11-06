import { z } from 'zod';
import { VALIDATION } from './messages';
import { optionalLine } from './text';

// The announcement bar at the top of the public page: one short line, an optional link, and an optional
// schedule ("Speaking at DevFest on Dec 5", "Open to work from January"). It is plain text, it can be
// closed by a visitor, and it goes away by itself after its end date.

export const ANNOUNCEMENT_TEXT_MAX = 140;
export const ANNOUNCEMENT_LABEL_MAX = 30;
// What the link says when the owner has not chosen a label (the interface strings have it per language).
export const ANNOUNCEMENT_LABEL_DEFAULT = 'Learn more';
// The end of a schedule may be at most this far from now, so an announcement cannot be left up for good.
export const ANNOUNCEMENT_MAX_MONTHS_AHEAD = 12;

// info: a quiet tint with a thin accent edge. highlight: a soft accent fill. notice: a solid accent fill.
export const ANNOUNCEMENT_STYLES = ['info', 'highlight', 'notice'] as const;
export const announcementStyleSchema = z.enum(ANNOUNCEMENT_STYLES);
export type AnnouncementStyle = z.infer<typeof announcementStyleSchema>;
export const DEFAULT_ANNOUNCEMENT_STYLE: AnnouncementStyle = 'info';

export const ANNOUNCEMENT_STYLE_LABELS: Record<AnnouncementStyle, string> = {
  info: 'Quiet',
  highlight: 'Soft color',
  notice: 'Solid color',
};

// ---- fields

// Only http(s), with no login in it and no spaces. A scheme such as javascript: or data: never passes,
// however it is spelled (the URL parser removes tabs and line breaks before reading the scheme, and the
// protocol that comes out is what is checked).
export function isHttpUrl(value: string): boolean {
  if (/\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

export const optionalHttpUrl = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null)
  .pipe(
    z
      .string()
      .max(2048, VALIDATION.tooLong(2048))
      .refine(isHttpUrl, VALIDATION.urlScheme)
      .nullable(),
  );

// A date and time as an instant: an ISO string or a Date in, a Date or null out. Blank means none.
const instant = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.date({ errorMap: () => ({ message: VALIDATION.dateInvalid }) }).nullable(),
);

// The same instant as the editor reads it back (JSON has no dates).
export const isoInstant = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

// ---- rules

interface Checked {
  announcementEnabled: boolean;
  announcementText: string | null;
  announcementLinkUrl: string | null;
  announcementStartsAt: Date | null;
  announcementEndsAt: Date | null;
}

export const monthsAhead = (from: Date, months: number) => {
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + months);
  return to;
};

// What is wrong with an announcement, as issues for a form (path = the field). `now` is a parameter so
// the checks are the same on the server and in the dashboard, and can be tested.
export function announcementIssues(a: Checked, now: Date): { path: string[]; message: string }[] {
  const issues: { path: string[]; message: string }[] = [];
  const add = (field: string, message: string) => issues.push({ path: [field], message });
  if (a.announcementEnabled && !a.announcementText) {
    add('announcementText', VALIDATION.announcementTextRequired);
  }
  if (a.announcementLinkUrl && !a.announcementText) {
    add('announcementLinkUrl', VALIDATION.announcementLinkNeedsText);
  }
  const { announcementStartsAt: start, announcementEndsAt: end } = a;
  if (start && end && end.getTime() <= start.getTime()) {
    add('announcementEndsAt', VALIDATION.rangeEndAfterStart);
  } else if (end && end.getTime() > monthsAhead(now, ANNOUNCEMENT_MAX_MONTHS_AHEAD).getTime()) {
    add('announcementEndsAt', VALIDATION.announcementEndTooFar);
  }
  return issues;
}

// PUT /profile/me/announcement: the whole announcement, saved together so a change of text, link or dates
// is one change (and one new version). A label means nothing without a link, so it is dropped.
export const announcementSettingsSchema = z
  .object({
    announcementEnabled: z.boolean(),
    announcementText: optionalLine(ANNOUNCEMENT_TEXT_MAX),
    announcementLinkUrl: optionalHttpUrl,
    announcementLinkLabel: optionalLine(ANNOUNCEMENT_LABEL_MAX),
    announcementStyle: announcementStyleSchema.default(DEFAULT_ANNOUNCEMENT_STYLE),
    announcementStartsAt: instant,
    announcementEndsAt: instant,
    announcementDismissible: z.boolean().default(true),
    announcementScroll: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    for (const issue of announcementIssues(value, new Date())) {
      ctx.addIssue({ code: 'custom', ...issue });
    }
  })
  .transform((value) => ({
    ...value,
    announcementLinkLabel: value.announcementLinkUrl ? value.announcementLinkLabel : null,
  }));
export type AnnouncementSettings = z.infer<typeof announcementSettingsSchema>;

// ---- when it shows

export type AnnouncementState = 'off' | 'scheduled' | 'live' | 'ended';

interface Windowed extends Pick<Checked, 'announcementEnabled' | 'announcementText'> {
  announcementStartsAt: Date | string | null;
  announcementEndsAt: Date | string | null;
}

const time = (value: Date | string | null) => (value === null ? null : new Date(value).getTime());

// off: not switched on (or nothing written). scheduled: on, but its start is ahead. live: on and inside its
// window (no start means now, no end means until it is switched off). ended: on, but its end has passed.
export function announcementState(a: Windowed, now: Date): AnnouncementState {
  if (!a.announcementEnabled || !a.announcementText) return 'off';
  const start = time(a.announcementStartsAt);
  const end = time(a.announcementEndsAt);
  if (end !== null && end <= now.getTime()) return 'ended';
  if (start !== null && start > now.getTime()) return 'scheduled';
  return 'live';
}

// ---- what a visitor gets

// Left out of the public page entirely unless the announcement is live. `endsAt` is there so a page that
// was cached a moment ago can still take itself down at the end.
export const publicAnnouncementSchema = z.object({
  text: z.string(),
  linkUrl: z.string().nullable(),
  linkLabel: z.string().nullable(),
  style: announcementStyleSchema,
  dismissible: z.boolean(),
  // The text scrolls slowly along the bar (never for a visitor who asks for less motion).
  scroll: z.boolean().default(false),
  version: z.number().int(),
  endsAt: z.string().nullable(),
});
export type PublicAnnouncement = z.infer<typeof publicAnnouncementSchema>;

interface Stored extends Windowed {
  announcementLinkUrl: string | null;
  announcementLinkLabel: string | null;
  announcementStyle: AnnouncementStyle;
  announcementDismissible: boolean;
  announcementScroll: boolean;
  announcementVersion: number;
}

// The public view of a stored announcement, or null when it is not live. The words go through `words` so
// the caller can put the visitor's language in them.
export function publicAnnouncement(
  a: Stored,
  now: Date,
  words: { text: (original: string) => string; label: (original: string | null) => string | null },
): PublicAnnouncement | null {
  if (announcementState(a, now) !== 'live' || !a.announcementText) return null;
  return {
    text: words.text(a.announcementText),
    linkUrl: a.announcementLinkUrl,
    linkLabel: a.announcementLinkUrl ? words.label(a.announcementLinkLabel) : null,
    style: a.announcementStyle,
    dismissible: a.announcementDismissible,
    scroll: a.announcementScroll,
    version: a.announcementVersion,
    endsAt: a.announcementEndsAt === null ? null : new Date(a.announcementEndsAt).toISOString(),
  };
}

// Whether the change is one a visitor who closed the old announcement should see again: its words, link
// or dates. The look, whether it scrolls, whether it can be closed and the switch can change without a new
// version.
export function announcementChanged(
  before: {
    announcementText: string | null;
    announcementLinkUrl: string | null;
    announcementLinkLabel: string | null;
    announcementStartsAt: Date | null;
    announcementEndsAt: Date | null;
  },
  after: typeof before,
): boolean {
  return (
    before.announcementText !== after.announcementText ||
    before.announcementLinkUrl !== after.announcementLinkUrl ||
    before.announcementLinkLabel !== after.announcementLinkLabel ||
    time(before.announcementStartsAt) !== time(after.announcementStartsAt) ||
    time(before.announcementEndsAt) !== time(after.announcementEndsAt)
  );
}
