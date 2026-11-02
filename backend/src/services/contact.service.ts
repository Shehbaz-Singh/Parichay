import {
  CONTACT_PAGE_SIZE,
  CONTACT_STATUSES,
  type ContactCounts,
  type ContactListQuery,
  type ContactMessageInput,
  type ContactSettings,
  type ContactStatus,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { config } from '../lib/config';
import { AppError } from '../lib/errors';
import { checkFormToken, issueFormToken } from '../lib/form-token';
import { WAIT, lockProfile } from '../lib/locks';
import { ERRORS } from '../lib/messages';
import { prisma } from '../lib/prisma';
import { publishedProfile } from '../lib/profile';
import { orNotFound } from '../lib/prisma-errors';
import { captchaSiteKey, verifyCaptcha } from '../lib/turnstile';
import { createVisitorLimiter } from '../lib/visitor-limit';

// The contact form and the owner's inbox. Nothing here sends an email: a message is a row that the
// owner reads in the dashboard. A message is always looked up by (id, profileId), so one that
// belongs to someone else looks exactly like one that does not exist (404).

const notFound = () => AppError.notFound(ERRORS.messageNotFound);

const DAY_MS = 24 * 60 * 60 * 1000;

// One visitor: 3 messages an hour and 10 a day. In memory (see lib/visitor-limit.ts).
const visitorAllowed = createVisitorLimiter(3, 10);
// One profile: at most this many messages a day, counted in the database so it survives a restart.
const PROFILE_DAILY_CAP = 20;

// Messages older than this are gone (the sweep deletes them; the queries below also skip them, so
// nobody sees one that is waiting for the sweep).
const cutoff = () => new Date(Date.now() - config.CONTACT_RETENTION_DAYS * DAY_MS);
const alive = () => ({ createdAt: { gte: cutoff() } });

const received = () => ({ received: true as const });

// ---- visitors

// A page with a form that is switched on: published, not a sample. Anything else is the same 404,
// so nothing is learned about a profile that is not offering one.
async function formProfile(slug: string) {
  return publishedProfile(slug, { id: true }, { isSample: false, contactFormEnabled: true });
}

// What the form needs when it opens: a signed time stamp and, when the server uses Turnstile, the
// public key of the widget.
export async function formInfo(slug: string) {
  await formProfile(slug);
  const siteKey = captchaSiteKey();
  return { token: issueFormToken(slug), captcha: siteKey ? { siteKey } : null };
}

// The answer is the same "received" whether the message was kept or quietly dropped (sent too fast,
// or the same message again), so a script cannot tell. What a visitor is told otherwise is generic:
// the form timed out, the check failed, or "too many" without saying which limit.
export async function submit(
  slug: string,
  input: ContactMessageInput & { formToken: string; captcha?: string },
  visitor: string,
) {
  const profile = await formProfile(slug);

  const token = checkFormToken(slug, input.formToken);
  if (token === 'early') return received();
  if (token === 'invalid') throw new AppError(400, 'FORM_EXPIRED', ERRORS.contactExpired);
  if (!(await verifyCaptcha(input.captcha))) {
    throw new AppError(400, 'CAPTCHA_FAILED', ERRORS.contactCaptcha);
  }
  const busy = () => new AppError(429, 'RATE_LIMITED', ERRORS.contactBusy);
  if (!visitorAllowed(visitor)) throw busy();

  const { senderName, senderEmail, subject, message } = input;
  const since = new Date(Date.now() - DAY_MS);

  // The profile is locked so two messages at once cannot both pass the checks.
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profile.id);

    const same = await tx.contactMessage.findFirst({
      where: { profileId: profile.id, senderEmail, message, createdAt: { gte: since } },
      select: { id: true },
    });
    if (same) return received();

    const today = await tx.contactMessage.count({
      where: { profileId: profile.id, createdAt: { gte: since } },
    });
    if (today >= PROFILE_DAILY_CAP) throw busy();

    await tx.contactMessage.create({
      data: { profileId: profile.id, senderName, senderEmail, subject, message },
    });
    return received();
  }, WAIT);
}

// ---- the owner

const SNIPPET = 140;
const snippetOf = (message: string) => {
  const line = message.replace(/\s+/g, ' ').trim();
  return line.length > SNIPPET ? `${line.slice(0, SNIPPET - 1)}…` : line;
};

async function counts(profileId: string): Promise<ContactCounts> {
  const rows = await prisma.contactMessage.groupBy({
    by: ['status'],
    where: { profileId, ...alive() },
    _count: { _all: true },
  });
  const result: ContactCounts = { new: 0, read: 0, archived: 0 };
  for (const row of rows) result[row.status] = row._count._all;
  return result;
}

export async function list(profileId: string, { status, page }: ContactListQuery) {
  const where: Prisma.ContactMessageWhereInput = {
    profileId,
    ...alive(),
    ...(status && { status }),
  };
  const [rows, all] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * CONTACT_PAGE_SIZE,
      take: CONTACT_PAGE_SIZE,
      select: {
        id: true,
        senderName: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        readAt: true,
      },
    }),
    counts(profileId),
  ]);
  const total = status ? all[status] : CONTACT_STATUSES.reduce((sum, key) => sum + all[key], 0);
  return {
    items: rows.map(({ message, ...row }) => ({ ...row, snippet: snippetOf(message) })),
    total,
    page,
    pageSize: CONTACT_PAGE_SIZE,
    counts: all,
    retentionDays: config.CONTACT_RETENTION_DAYS,
  };
}

export const unreadCount = async (profileId: string) => ({
  unread: await prisma.contactMessage.count({ where: { profileId, status: 'new', ...alive() } }),
});

export async function get(profileId: string, id: string) {
  const message = await prisma.contactMessage.findFirst({
    where: { id, profileId, ...alive() },
    omit: { profileId: true },
  });
  if (!message) throw notFound();
  return message;
}

// New and read are about whether the owner has looked: reading stamps the time, marking unread
// clears it. Archiving leaves it as it was. Safe to repeat.
export const setStatus = (profileId: string, id: string, status: ContactStatus) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.contactMessage.findFirst({
      where: { id, profileId, ...alive() },
      select: { readAt: true },
    });
    if (!current) throw notFound();
    const readAt =
      status === 'read' ? (current.readAt ?? new Date()) : status === 'new' ? null : current.readAt;
    return tx.contactMessage.update({
      where: { id },
      data: { status, readAt },
      omit: { profileId: true },
    });
  });

export const remove = (profileId: string, id: string) =>
  orNotFound(prisma.contactMessage.delete({ where: { id, profileId } }), notFound);

export const saveSettings = (
  profileId: string,
  { contactFormEnabled, contactFormIntro }: ContactSettings,
) =>
  prisma.profile.update({
    where: { id: profileId },
    data: { contactFormEnabled, contactFormIntro },
    select: { contactFormEnabled: true, contactFormIntro: true },
  });

// ---- retention

// Deletes messages past the retention period. Run by the scheduled sweep.
export async function purgeExpired(): Promise<number> {
  const { count } = await prisma.contactMessage.deleteMany({
    where: { createdAt: { lt: cutoff() } },
  });
  return count;
}
