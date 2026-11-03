import { z } from 'zod';
import { VALIDATION } from './messages';

// The "Working together" card: when and how to reach the owner. Everything here is optional, and the
// card only reaches a visitor while the owner has it switched on.

export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];
export const WEEKDAYS: readonly WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

// ---- time zone

// The zones the runtime knows, as Intl names them. "UTC" is not in that list on some engines but is a
// zone people rightly choose; a few engines also list an old name for a zone (Asia/Calcutta) that
// another lists under its new one (Asia/Kolkata), so a well-formed "Area/City" name that the runtime
// itself can use is accepted too.
let known: Set<string> | undefined;
function knownZones(): Set<string> {
  if (!known) {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    known = new Set(intl.supportedValuesOf?.('timeZone') ?? []);
  }
  return known;
}

export function isTimeZone(value: string): boolean {
  if (knownZones().has(value) || value === 'UTC') return true;
  if (!/^[A-Za-z_]+\/[A-Za-z0-9_+\-/]+$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const timeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine(isTimeZone, VALIDATION.timeZoneUnknown);

// ---- weekly hours

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeSchema = z.string().regex(TIME_PATTERN, VALIDATION.timeFormat);

export const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const timeRangeSchema = z
  .object({ start: timeSchema, end: timeSchema })
  .refine((range) => minutesOf(range.start) < minutesOf(range.end), {
    message: VALIDATION.rangeEndAfterStart,
    path: ['end'],
  });

// A day is closed (no ranges) or has one or two ranges, in order and not overlapping. A range does
// not cross midnight: a late shift is written as two days.
const daySchema = z
  .array(timeRangeSchema)
  .max(2, VALIDATION.tooManyRanges)
  .refine(
    (ranges) => ranges.length < 2 || minutesOf(ranges[0].end) <= minutesOf(ranges[1].start),
    VALIDATION.rangesOverlap,
  );

export const workingHoursSchema = z.object({
  mon: daySchema,
  tue: daySchema,
  wed: daySchema,
  thu: daySchema,
  fri: daySchema,
  sat: daySchema,
  sun: daySchema,
});
export type WorkingHours = z.infer<typeof workingHoursSchema>;

export const closedWeek = (): WorkingHours => ({
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
});

// Stored JSON of any shape becomes a valid week (a broken one is a closed week), so a page never fails on it.
export const readWorkingHours = (value: unknown): WorkingHours => {
  const parsed = workingHoursSchema.safeParse(value);
  return parsed.success ? parsed.data : closedWeek();
};

// ---- the rest

export const REPLY_TIMES = ['same_day', 'within_2_days', 'within_a_week'] as const;
export const replyTimeSchema = z.enum(REPLY_TIMES);

export const PREFERRED_CONTACTS = ['email', 'linkedin', 'phone', 'any_visible_link'] as const;
export const preferredContactSchema = z.enum(PREFERRED_CONTACTS);
export type PreferredContact = z.infer<typeof preferredContactSchema>;

export const WORK_NOTE_MAX = 140;

// Which of the owner's links a preferred contact can point to. "any_visible_link" needs only one
// visible link of a kind a visitor can use. `visibleTypes` are the types of links that are shown.
export const contactAvailable = (
  contact: PreferredContact,
  visibleTypes: readonly string[],
): boolean =>
  contact === 'any_visible_link' ? visibleTypes.length > 0 : visibleTypes.includes(contact);
