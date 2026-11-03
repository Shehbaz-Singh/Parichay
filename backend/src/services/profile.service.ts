import { contactAvailable, type ProfileUpdateInput } from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { isUniqueViolation } from '../lib/prisma-errors';
import {
  customItems,
  myLinkBioLinks,
  myPostSummaries,
  myTestimonials,
  orderedList,
  profileSelect,
  projectList,
} from '../lib/selects';
import { withPages } from './page-layout.service';
import { withSections } from './section-layout.service';
import { assertSlugAvailable, slugTaken } from './slug.service';
import { ERRORS } from '../lib/messages';
import { ownProfile } from '../lib/profile';

// The whole profile as the editor (and later the public page) needs it, in one query.
const fullProfileSelect = {
  ...profileSelect,
  sectionConfig: true,
  customPages: {
    select: { id: true, slug: true, title: true, body: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  links: orderedList,
  skills: orderedList,
  experience: orderedList,
  projects: projectList,
  education: orderedList,
  customSections: {
    select: { id: true, title: true, visible: true, order: true, items: customItems },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
  testimonials: myTestimonials,
  linkBioLinks: myLinkBioLinks,
  posts: myPostSummaries,
} satisfies Prisma.ProfileSelect;

export async function getProfile(profileId: string) {
  const profile = await ownProfile(profileId, fullProfileSelect);
  return withPages(withSections(profile));
}

// The "Working together" card has to make sense before it is saved: it needs a time zone to be of
// any use, and a preferred way to be reached has to be a link the owner is showing.
async function assertWorkCard(profileId: string, input: ProfileUpdateInput) {
  if (input.workCardEnabled && !input.timezone) {
    throw new AppError(400, 'VALIDATION_ERROR', ERRORS.timeZoneForCard, [
      { path: 'timezone', message: ERRORS.timeZoneField },
    ]);
  }
  if (!input.preferredContact) return;
  const links = await prisma.link.findMany({
    where: { profileId, visible: true },
    select: { type: true },
  });
  if (
    !contactAvailable(
      input.preferredContact,
      links.map((link) => link.type),
    )
  ) {
    throw new AppError(400, 'VALIDATION_ERROR', ERRORS.contactNotVisible, [
      {
        path: 'preferredContact',
        message: ERRORS.contactNotVisibleField,
      },
    ]);
  }
}

export async function updateProfile(profileId: string, input: ProfileUpdateInput) {
  const { slug, ...fields } = input;
  if (slug) await assertSlugAvailable(slug, profileId);
  await assertWorkCard(profileId, input);

  try {
    return withPages(
      withSections(
        await prisma.profile.update({
          where: { id: profileId },
          data: { ...fields, ...(slug && { slug }) },
          select: fullProfileSelect,
        }),
      ),
    );
  } catch (err) {
    // Someone else claimed the slug between the check and the update.
    if (isUniqueViolation(err)) throw slugTaken();
    throw err;
  }
}

// With no value the flag is toggled; with a value it is set, so retries are safe.
export async function setPublished(profileId: string, published?: boolean) {
  let next = published;
  if (next === undefined) {
    const current = await ownProfile(profileId, { published: true });
    next = !current.published;
  }

  return prisma.profile.update({
    where: { id: profileId },
    data: { published: next },
    select: { published: true },
  });
}
