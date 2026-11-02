import {
  MAX_PENDING_TESTIMONIALS,
  MAX_TESTIMONIALS,
  type TestimonialInput,
  type TestimonialStatus,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { WAIT, lockProfile } from '../lib/locks';
import { prisma } from '../lib/prisma';
import { publishedProfile } from '../lib/profile';
import { assertExactIds } from '../lib/reorder';
import { orNotFound } from '../lib/prisma-errors';
import { myTestimonials } from '../lib/selects';
import { ERRORS } from '../lib/messages';

// Testimonials. A testimonial is always looked up by (id, profileId), so one that belongs to
// someone else looks exactly like one that does not exist (404).

const notFound = () => AppError.notFound(ERRORS.testimonialNotFound);

// The fields of the input and nothing else (a public submission also carries the honeypot).
const fields = ({
  authorName,
  authorRole,
  authorCompany,
  message,
  contactEmail,
}: TestimonialInput) => ({ authorName, authorRole, authorCompany, message, contactEmail });

// One past the highest order in the profile, so a new or newly approved testimonial goes last.
async function nextOrder(tx: Prisma.TransactionClient, profileId: string) {
  const { _max } = await tx.testimonial.aggregate({ where: { profileId }, _max: { order: true } });
  return (_max.order ?? -1) + 1;
}

const tooMany = () => AppError.conflict('LIMIT_REACHED', ERRORS.testimonialLimit);

// ---- visitors

// Only for a published profile that is accepting them. Always saved as pending, whatever the
// request says. Unpublished and missing profiles give the same 404.
export async function submit(slug: string, input: TestimonialInput) {
  const profile = await publishedProfile(slug, { id: true, acceptTestimonials: true });
  if (!profile.acceptTestimonials) {
    throw new AppError(403, 'TESTIMONIALS_CLOSED', ERRORS.testimonialsClosed);
  }

  await prisma.$transaction(async (tx) => {
    await lockProfile(tx, profile.id);
    const [total, pending] = await Promise.all([
      tx.testimonial.count({ where: { profileId: profile.id } }),
      tx.testimonial.count({ where: { profileId: profile.id, status: 'pending' } }),
    ]);
    if (total >= MAX_TESTIMONIALS || pending >= MAX_PENDING_TESTIMONIALS) throw tooMany();
    await tx.testimonial.create({
      data: {
        ...fields(input),
        profileId: profile.id,
        status: 'pending',
        order: await nextOrder(tx, profile.id),
      },
    });
  }, WAIT);
}

// ---- the owner

export const list = (profileId: string) =>
  prisma.testimonial.findMany({ where: { profileId }, ...myTestimonials });

// Added by hand, so approved at once.
export function create(profileId: string, input: TestimonialInput) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    if ((await tx.testimonial.count({ where: { profileId } })) >= MAX_TESTIMONIALS) {
      throw tooMany();
    }
    return tx.testimonial.create({
      data: {
        ...fields(input),
        profileId,
        status: 'approved',
        order: await nextOrder(tx, profileId),
      },
      omit: myTestimonials.omit,
    });
  }, WAIT);
}

// Edits the text. The status and place in the list are not touched.
export const update = (profileId: string, id: string, input: TestimonialInput) =>
  orNotFound(
    prisma.testimonial.update({
      where: { id, profileId },
      data: fields(input),
      omit: myTestimonials.omit,
    }),
    notFound,
  );

// Approve or reject. Safe to repeat. A testimonial that becomes approved goes to the end of the
// approved ones; one that already is approved keeps its place.
export function setStatus(profileId: string, id: string, status: TestimonialStatus) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    const current = await tx.testimonial.findFirst({
      where: { id, profileId },
      select: { status: true },
    });
    if (!current) throw notFound();
    if (current.status === status) {
      return tx.testimonial.findUniqueOrThrow({ where: { id }, omit: myTestimonials.omit });
    }
    return tx.testimonial.update({
      where: { id },
      data: { status, ...(status === 'approved' && { order: await nextOrder(tx, profileId) }) },
      omit: myTestimonials.omit,
    });
  }, WAIT);
}

export const remove = (profileId: string, id: string) =>
  orNotFound(prisma.testimonial.delete({ where: { id, profileId } }), notFound);

// `ids` is the new order of the approved testimonials. It must list every one exactly once, which
// also guarantees it can only contain this profile's own.
export function reorder(profileId: string, ids: string[]) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    const approved = await tx.testimonial.findMany({
      where: { profileId, status: 'approved' },
      select: { id: true },
    });
    assertExactIds(ids, approved, ERRORS.reorderTestimonials);
    for (const [order, id] of ids.entries()) {
      await tx.testimonial.update({ where: { id }, data: { order }, select: { id: true } });
    }
    return tx.testimonial.findMany({ where: { profileId }, ...myTestimonials });
  }, WAIT);
}

export const setAccepting = (profileId: string, acceptTestimonials: boolean) =>
  prisma.profile.update({
    where: { id: profileId },
    data: { acceptTestimonials },
    select: { acceptTestimonials: true },
  });
