import {
  announcementChanged,
  publicAnnouncement,
  type AnnouncementSettings,
} from '@parichay/shared';
import { prisma } from '../lib/prisma';
import { ownProfile } from '../lib/profile';
import { pick, type Lookup } from './translation.service';

// The announcement bar's settings (shared/src/announcement.ts), saved all together in one request.

const announcementSelect = {
  announcementEnabled: true,
  announcementText: true,
  announcementLinkUrl: true,
  announcementLinkLabel: true,
  announcementStyle: true,
  announcementStartsAt: true,
  announcementEndsAt: true,
  announcementDismissible: true,
  announcementScroll: true,
  announcementVersion: true,
} as const;

// A change of words, link or dates is a new version, so a visitor who closed the old one sees it again.
// The translations of words that changed are dropped in the same transaction: an old translation must
// never be shown for new words (the date in it could be wrong). Until it is translated again, visitors
// of another language see the default language.
export function saveAnnouncement(profileId: string, input: AnnouncementSettings) {
  return prisma.$transaction(async (tx) => {
    const before = await ownProfile(profileId, announcementSelect, tx);
    const changed = announcementChanged(before, input);
    const stale = [
      ...(before.announcementText !== input.announcementText ? ['announcementText'] : []),
      ...(before.announcementLinkLabel !== input.announcementLinkLabel
        ? ['announcementLinkLabel']
        : []),
    ];
    if (stale.length > 0) {
      await tx.translation.deleteMany({
        where: { profileId, entityType: 'profile', entityId: profileId, field: { in: stale } },
      });
    }
    return tx.profile.update({
      where: { id: profileId },
      data: { ...input, ...(changed && { announcementVersion: { increment: 1 } }) },
      select: announcementSelect,
    });
  });
}

// The columns a public response needs to work out the announcement, and what it makes of them.
export const announcementPublicSelect = announcementSelect;

type StoredAnnouncement = {
  [K in keyof typeof announcementSelect]: Awaited<ReturnType<typeof saveAnnouncement>>[K];
};

// The announcement as a visitor gets it, or undefined while there is none to show: it is off, outside
// its dates (checked against the server's clock, so an expired one is never returned), or the profile is
// a sample. The words are in the language asked for, falling back to the default language field by field.
export function visibleAnnouncement(
  profile: StoredAnnouncement & { id: string; isSample: boolean },
  lookup: Lookup | null,
  now = new Date(),
) {
  if (profile.isSample) return undefined;
  const say = (field: string, original: string | null) =>
    lookup && original ? pick(lookup, 'profile', profile.id, field, original) : original;
  return (
    publicAnnouncement(profile, now, {
      text: (original) => say('announcementText', original) ?? original,
      label: (original) => say('announcementLinkLabel', original),
    }) ?? undefined
  );
}
