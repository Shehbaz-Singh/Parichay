import { z } from 'zod';
import { availabilityStatusSchema } from './availability';
import { linkBioStyleSchema, myLinkBioButtonSchema } from './link-bio';
import { linkTypeSchema } from './portfolio';
import { replyTimeSchema, workingHoursSchema } from './work-card';

// ---- what a visitor gets: GET /public/:slug/links

// Only what the card draws. The owner's visible links come as the portfolio gives them (hidden ones
// never reach it) and there is no email address of the account anywhere in it.
export const publicLinkCardSchema = z.object({
  slug: z.string(),
  fullName: z.string(),
  tagline: z.string().nullable(),
  location: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  accentColor: z.string(),
  style: linkBioStyleSchema,
  isSample: z.boolean().default(false),
  // The language of this response, the profile's main language and the other ones that are ready.
  locale: z.string().default('en'),
  defaultLocale: z.string().default('en'),
  locales: z.array(z.string()).default([]),
  // Present only while the availability badge is on.
  availability: z
    .object({ status: availabilityStatusSchema, message: z.string().nullable() })
    .optional(),
  links: z.array(
    z.object({ id: z.string(), type: linkTypeSchema, url: z.string(), order: z.number() }),
  ),
  buttons: z.array(myLinkBioButtonSchema),
  // Which optional buttons to draw. `contactForm` is set when the form is on and the card shows it.
  contactForm: z.object({ intro: z.string().nullable(), retentionDays: z.number() }).optional(),
  vcard: z.boolean(),
  resume: z.boolean(),
  share: z.object({ message: z.string().nullable() }).optional(),
  // The working-together status line: the time zone and the hours, nothing else of the card.
  work: z
    .object({
      timezone: z.string(),
      workingHours: workingHoursSchema,
      replyTime: replyTimeSchema.nullable(),
    })
    .optional(),
});
export type PublicLinkCard = z.infer<typeof publicLinkCardSchema>;

// Which optional buttons the card draws. The public API and the dashboard's preview both ask this one
// function, so the preview shows exactly what visitors get. A button needs its feature to be on, and
// the owner's own "show it here" switch; a sample profile has neither a contact form nor a contact
// card, and the contact card needs at least one visible link to hold.
export interface LinkCardFeatureSource {
  isSample: boolean;
  contactFormEnabled: boolean;
  contactCardEnabled: boolean;
  resumeEnabled: boolean;
  workCardEnabled: boolean;
  timezone: string | null;
  linkBioShowContact: boolean;
  linkBioShowVcard: boolean;
  linkBioShowResume: boolean;
  linkBioShowShare: boolean;
  linkBioShowWork: boolean;
  visibleLinks: number;
}

export function linkCardFeatures(p: LinkCardFeatureSource) {
  return {
    contact: p.contactFormEnabled && !p.isSample && p.linkBioShowContact,
    vcard: p.contactCardEnabled && !p.isSample && p.visibleLinks > 0 && p.linkBioShowVcard,
    resume: p.resumeEnabled && p.linkBioShowResume,
    share: p.linkBioShowShare,
    work: p.workCardEnabled && Boolean(p.timezone) && p.linkBioShowWork,
  };
}
