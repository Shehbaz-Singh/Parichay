import { linkCardFeatures, readWorkingHours } from '@parichay/shared';
import { config } from '../lib/config';
import { publishedProfile } from '../lib/profile';
import { languageLookup } from './public.service';
import { pick } from './translation.service';

// GET /public/:slug/links: what the link-in-bio card draws, and nothing else. It is built from an
// explicit select, so a hidden link, the owner's account email or the profile's internal id can never
// reach it. A page that is unpublished, missing, or has the card switched off gives the same 404.
// Optional buttons come as a yes or no, worked out here, so the page cannot disagree with the
// features: a switched-off feature, or one without data, is simply absent.
export async function getLinkCard(slug: string, lang?: string) {
  const profile = await publishedProfile(
    slug,
    {
      id: true,
      slug: true,
      fullName: true,
      tagline: true,
      location: true,
      avatarUrl: true,
      accentColor: true,
      linkBioStyle: true,
      isSample: true,
      defaultLocale: true,
      locales: true,
      availabilityEnabled: true,
      availabilityStatus: true,
      availabilityMessage: true,
      // Hidden links are filtered in the database.
      links: {
        where: { visible: true },
        select: { id: true, type: true, url: true, order: true },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
      linkBioLinks: {
        select: { id: true, label: true, url: true, order: true },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
      linkBioShowContact: true,
      linkBioShowVcard: true,
      linkBioShowResume: true,
      linkBioShowShare: true,
      linkBioShowWork: true,
      contactFormEnabled: true,
      contactFormIntro: true,
      contactCardEnabled: true,
      resumeEnabled: true,
      shareMessage: true,
      workCardEnabled: true,
      timezone: true,
      workingHours: true,
      replyTime: true,
    },
    { linkBioEnabled: true },
  );

  const { enabled, locale, lookup } = await languageLookup(profile, lang);
  const features = linkCardFeatures({ ...profile, visibleLinks: profile.links.length });
  // The translation of a text of the profile itself, or the original (field by field).
  const own = (field: string, original: string | null) =>
    lookup && original ? pick(lookup, 'profile', profile.id, field, original) : original;

  return {
    slug: profile.slug,
    fullName: profile.fullName,
    tagline: own('tagline', profile.tagline),
    location: profile.location,
    avatarUrl: profile.avatarUrl,
    accentColor: profile.accentColor,
    style: profile.linkBioStyle,
    isSample: profile.isSample,
    locale,
    defaultLocale: profile.defaultLocale,
    locales: enabled,
    ...(profile.availabilityEnabled && {
      availability: {
        status: profile.availabilityStatus,
        message: own('availabilityMessage', profile.availabilityMessage),
      },
    }),
    links: profile.links,
    buttons: profile.linkBioLinks.map((button) => ({
      ...button,
      label: lookup ? pick(lookup, 'linkBioLink', button.id, 'label', button.label) : button.label,
    })),
    ...(features.contact && {
      contactForm: {
        intro: own('contactFormIntro', profile.contactFormIntro),
        retentionDays: config.CONTACT_RETENTION_DAYS,
      },
    }),
    vcard: features.vcard,
    resume: features.resume,
    ...(features.share && { share: { message: own('shareMessage', profile.shareMessage) } }),
    ...(features.work &&
      profile.timezone && {
        work: {
          timezone: profile.timezone,
          workingHours: readWorkingHours(profile.workingHours),
          replyTime: profile.replyTime,
        },
      }),
  };
}
