import {
  LINK_BIO_MAX_BUTTONS,
  type LinkBioButtonInput,
  type LinkBioSettings,
} from '@parichay/shared';
import { AppError } from '../lib/errors';
import { WAIT, lockProfile } from '../lib/locks';
import { ERRORS } from '../lib/messages';
import { prisma } from '../lib/prisma';
import { orNotFound } from '../lib/prisma-errors';
import { assertExactIds } from '../lib/reorder';
import { myLinkBioLinks } from '../lib/selects';
import { deleteTranslationsFor } from './translation.service';

// The owner's side of the link-in-bio card: its settings and its custom buttons. A button is always
// looked up by (id, profileId), so one that belongs to someone else looks exactly like one that does
// not exist (404). The public side is link-card.service.ts.

const notFound = () => AppError.notFound(ERRORS.linkBioButtonNotFound);
const tooMany = () => AppError.conflict('LIMIT_REACHED', ERRORS.linkBioLimit(LINK_BIO_MAX_BUTTONS));

export const list = (profileId: string) =>
  prisma.linkBioLink.findMany({ where: { profileId }, ...myLinkBioLinks });

// The new button goes last. Locked per profile so two requests at once cannot both pass the limit.
export function create(profileId: string, input: LinkBioButtonInput) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    if ((await tx.linkBioLink.count({ where: { profileId } })) >= LINK_BIO_MAX_BUTTONS) {
      throw tooMany();
    }
    const { _max } = await tx.linkBioLink.aggregate({
      where: { profileId },
      _max: { order: true },
    });
    return tx.linkBioLink.create({
      data: { ...input, profileId, order: (_max.order ?? -1) + 1 },
      omit: myLinkBioLinks.omit,
    });
  }, WAIT);
}

export const update = (profileId: string, id: string, input: LinkBioButtonInput) =>
  orNotFound(
    prisma.linkBioLink.update({ where: { id, profileId }, data: input, omit: myLinkBioLinks.omit }),
    notFound,
  );

export async function remove(profileId: string, id: string) {
  // One transaction, so a translation never outlives its button.
  await prisma.$transaction(async (tx) => {
    await orNotFound(tx.linkBioLink.delete({ where: { id, profileId } }), notFound);
    await deleteTranslationsFor(tx, profileId, 'linkBioLink', [id]);
  });
}

// `ids` is the new order. It must list every button exactly once, which also guarantees it can only
// contain this profile's own.
export function reorder(profileId: string, ids: string[]) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    const current = await tx.linkBioLink.findMany({ where: { profileId }, select: { id: true } });
    assertExactIds(ids, current, ERRORS.reorderLinkBio);
    for (const [order, id] of ids.entries()) {
      await tx.linkBioLink.update({ where: { id }, data: { order }, select: { id: true } });
    }
    return tx.linkBioLink.findMany({ where: { profileId }, ...myLinkBioLinks });
  }, WAIT);
}

const settingsSelect = {
  linkBioEnabled: true,
  linkBioStyle: true,
  linkBioShowContact: true,
  linkBioShowVcard: true,
  linkBioShowResume: true,
  linkBioShowShare: true,
  linkBioShowWork: true,
} as const;

// The card can only be switched on for a page that is published: before that its link goes nowhere.
// Changing the look of a card that is already on is always allowed, and so is switching it off.
export async function saveSettings(profileId: string, settings: LinkBioSettings) {
  const current = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { published: true, linkBioEnabled: true },
  });
  if (!current) throw AppError.notFound(ERRORS.profileNotFound);
  if (settings.linkBioEnabled && !current.linkBioEnabled && !current.published) {
    throw new AppError(400, 'VALIDATION_ERROR', ERRORS.linkBioNeedsPublish, [
      { path: 'linkBioEnabled', message: ERRORS.linkBioNeedsPublish },
    ]);
  }
  return prisma.profile.update({
    where: { id: profileId },
    data: settings,
    select: settingsSelect,
  });
}
