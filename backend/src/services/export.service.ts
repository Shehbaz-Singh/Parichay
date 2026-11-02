import { config } from '../lib/config';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  customItems,
  myLinkBioLinks,
  myTestimonials,
  orderedList,
  profileSelect,
} from '../lib/selects';
import { ERRORS } from '../lib/messages';

// Everything stored about the signed-in person, for them to keep. It is built from explicit selects,
// so the password hash can never end up in it. Internal foreign keys are left out; ids stay so the
// pieces can be told apart.
export async function exportAccountData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
      termsAcceptedAt: true,
      termsVersion: true,
      profile: {
        select: {
          ...profileSelect,
          sectionConfig: true,
          links: orderedList,
          skills: orderedList,
          experience: orderedList,
          projects: orderedList,
          education: orderedList,
          customSections: {
            select: { id: true, title: true, visible: true, order: true, items: customItems },
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
          },
          testimonials: myTestimonials,
          // The custom buttons of the link-in-bio card (the card's settings are on the profile).
          linkBioLinks: myLinkBioLinks,
          // Messages visitors sent through the contact form (only those still within the retention
          // period exist), with the sender's name and email.
          contactMessages: {
            omit: { profileId: true },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          },
          // The translated texts of every extra language (each says which thing it translates).
          translations: {
            omit: { id: true, profileId: true },
            orderBy: [
              { locale: 'asc' },
              { entityType: 'asc' },
              { entityId: 'asc' },
              { field: 'asc' },
            ],
          },
          // All posts with their bodies, drafts included.
          posts: { omit: { profileId: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
        },
      },
    },
  });
  if (!user) throw AppError.unauthorized(ERRORS.accountGone, 'INVALID_TOKEN');

  const { profile, email, createdAt, termsAcceptedAt, termsVersion } = user;
  return {
    exportedAt: new Date().toISOString(),
    account: {
      email,
      createdAt,
      agreedToTermsAt: termsAcceptedAt,
      termsVersion,
    },
    // The profile row holds the page settings too: theme, accent color, whether it is published,
    // the availability badge, and whether visitors may send testimonials.
    profile,
    notes: [
      'Your password is never included in this file, and is not stored in readable form.',
      'This service does not record page views or other analytics about your visitors, so there are none to export.',
      'A resume PDF you uploaded for import is not stored, so it is not part of this file.',
      'Testimonials include the contact email a visitor gave you, if they gave one. That email is never shown on your public page.',
      'Link-in-bio buttons are in the profile section: each has the text and the address it goes to. The card settings (on or off, look, which optional buttons show) are part of the profile.',
      `Contact messages are the ones visitors sent through your contact form, with their name and email address. They are deleted automatically after ${config.CONTACT_RETENTION_DAYS} days, so older ones are not in this file.`,
    ],
  };
}
