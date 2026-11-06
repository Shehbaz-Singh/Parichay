import { z } from 'zod';
import { VALIDATION } from './messages';
import {
  EMAIL_MAX,
  NO_TAGS,
  isPlain as plain,
  optionalLine,
  requiredBlock,
  requiredLine,
} from './text';

// The contact form of the public page and the owner's inbox. A visitor writes a message; it is kept
// in the database for a limited time and the owner reads it in the dashboard. Nothing is emailed:
// the owner replies from their own email app. The sender's address is for the owner only.

export const CONTACT_STATUSES = ['new', 'read', 'archived'] as const;
export const contactStatusSchema = z.enum(CONTACT_STATUSES);
export type ContactStatus = z.infer<typeof contactStatusSchema>;

export const CONTACT_NAME_MIN = 2;
export const CONTACT_NAME_MAX = 80;
export const CONTACT_EMAIL_MAX = EMAIL_MAX;
export const CONTACT_SUBJECT_MAX = 120;
export const CONTACT_MESSAGE_MIN = 20;
export const CONTACT_MESSAGE_MAX = 2000;
export const CONTACT_INTRO_MAX = 140;
export const CONTACT_MAX_LINKS = 2;

// How long messages are kept unless the server says otherwise (CONTACT_RETENTION_DAYS).
export const CONTACT_DEFAULT_RETENTION_DAYS = 90;

// A form that is sent sooner than this after it was shown was filled in by a script, and one that
// was shown longer ago than the maximum has gone stale (the page is reloaded to get a new one).
export const CONTACT_MIN_SECONDS = 3;
export const CONTACT_TOKEN_MAX_SECONDS = 60 * 60;

// The owner's inbox is shown a page at a time.
export const CONTACT_PAGE_SIZE = 20;

// Things that read as a link: an address with a scheme or "www.", or a domain with a common ending.
// An email address is taken out first, so writing one down is not counted.
const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const LINK =
  /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|in|dev|app|xyz|info|biz|me|ly|ru|cn|top|site|online|link|click|shop|store)\b/gi;
export const countLinks = (text: string) =>
  (text.replace(EMAIL_IN_TEXT, ' ').match(LINK) ?? []).length;

export const TOO_MANY_LINKS = `Please use at most ${CONTACT_MAX_LINKS} links in a message`;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(CONTACT_EMAIL_MAX, VALIDATION.tooLong(CONTACT_EMAIL_MAX))
  .email(VALIDATION.emailInvalid);

// What a visitor writes.
export const contactMessageInputSchema = z.object({
  senderName: requiredLine(CONTACT_NAME_MAX, CONTACT_NAME_MIN).refine(plain, NO_TAGS),
  senderEmail: email,
  subject: optionalLine(CONTACT_SUBJECT_MAX).refine(plain, NO_TAGS),
  message: requiredBlock(CONTACT_MESSAGE_MAX, CONTACT_MESSAGE_MIN)
    .refine(plain, NO_TAGS)
    .refine((text) => countLinks(text) <= CONTACT_MAX_LINKS, TOO_MANY_LINKS),
});
export type ContactMessageInput = z.infer<typeof contactMessageInputSchema>;

// POST /public/:slug/contact. `website` is the honeypot (see testimonials.ts): hidden on the form,
// so a person leaves it empty. `formToken` is what GET /public/:slug/contact handed out when the
// form was shown, and `captcha` is the Turnstile answer, when the server asks for one.
export const CONTACT_HONEYPOT_FIELD = 'website';
export const contactSubmissionSchema = contactMessageInputSchema.extend({
  [CONTACT_HONEYPOT_FIELD]: z.string().max(500).optional(),
  formToken: z.string().min(1).max(400),
  captcha: z.string().max(4096).optional(),
});
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

// GET /public/:slug/contact: what the form needs when it opens.
export const contactFormInfoSchema = z.object({
  token: z.string(),
  // Present only while the server has Turnstile keys.
  captcha: z.object({ siteKey: z.string() }).nullable(),
});
export type ContactFormInfo = z.infer<typeof contactFormInfoSchema>;

// What the public API says about the form of a page that has it switched on.
export const publicContactFormSchema = z.object({
  intro: z.string().nullable(),
  retentionDays: z.number(),
});

// PUT /profile/me/messages/settings
export const contactSettingsSchema = z.object({
  contactFormEnabled: z.boolean(),
  contactFormIntro: optionalLine(CONTACT_INTRO_MAX),
});
export type ContactSettings = z.infer<typeof contactSettingsSchema>;

// ---- the owner's inbox

export const contactListQuerySchema = z.object({
  status: contactStatusSchema.optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type ContactListQuery = z.infer<typeof contactListQuerySchema>;

// PATCH /profile/me/messages/:id
export const contactStatusUpdateSchema = z.object({ status: contactStatusSchema });

const messageBase = {
  id: z.string(),
  senderName: z.string(),
  subject: z.string().nullable(),
  status: contactStatusSchema,
  createdAt: z.string(),
  readAt: z.string().nullable(),
};

// A row of the list: the start of the message is enough.
export const contactMessageSummarySchema = z.object({
  ...messageBase,
  snippet: z.string(),
});

// One message in full.
export const contactMessageSchema = z.object({
  ...messageBase,
  senderEmail: z.string(),
  message: z.string(),
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;

export const contactCountsSchema = z.object({
  new: z.number(),
  read: z.number(),
  archived: z.number(),
});
export type ContactCounts = z.infer<typeof contactCountsSchema>;

export const contactListSchema = z.object({
  items: z.array(contactMessageSummarySchema),
  total: z.number(), // messages with the chosen status (or all of them)
  page: z.number(),
  pageSize: z.number(),
  counts: contactCountsSchema,
  retentionDays: z.number(),
});
export type ContactList = z.infer<typeof contactListSchema>;

export const contactUnreadSchema = z.object({ unread: z.number() });
export type ContactUnread = z.infer<typeof contactUnreadSchema>;
