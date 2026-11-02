import { z } from 'zod';
import { VALIDATION } from './messages';
import { requiredLine } from './text';

// Link-in-bio: a compact, mobile-first card version of the portfolio at /<slug>/links, for the bio of
// an Instagram profile, a WhatsApp status or an email signature. It shows the owner's own custom
// buttons (kept in the LinkBioLink table), the links they already show on the portfolio, and the
// buttons of features they have switched on. Nothing here is a new way to reach the owner: the card
// reads the same public data, and never carries the owner's account email.

export const LINK_BIO_STYLES = ['light', 'soft'] as const;
export const linkBioStyleSchema = z.enum(LINK_BIO_STYLES);
export type LinkBioStyle = z.infer<typeof linkBioStyleSchema>;
export const DEFAULT_LINK_BIO_STYLE: LinkBioStyle = 'light';

export const LINK_BIO_MAX_BUTTONS = 8;
export const LINK_BIO_LABEL_MAX = 40;
export const LINK_BIO_URL_MAX = 2048;

// ---- one custom button

// Text of any kind that is not a tag: a label is shown as text, never read as markup.
const TAG = /<\/?[a-z!][^>]*>/i;
const NO_TAGS = 'Plain text only, please leave out HTML tags';

const isControl = (char: string) => {
  const code = char.charCodeAt(0);
  return code < 32 || code === 127 || (code >= 0x80 && code < 0xa0);
};

// An address a visitor will be sent to. Only http and https, with a host and no password in it:
// "javascript:", "data:", "vbscript:", "file:", "mailto:" and the rest are refused, control characters
// (which can hide a scheme, as in "java\nscript:") are removed first, and what is stored is the
// normalised form the URL parser makes (lowercase host, escaped characters), so what is checked is
// exactly what is saved.
export const linkBioUrlSchema = z
  .string()
  .transform((value) =>
    [...value]
      .filter((char) => !isControl(char))
      .join('')
      .trim(),
  )
  .pipe(z.string().min(1, VALIDATION.urlScheme).max(LINK_BIO_URL_MAX))
  .transform((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({ code: 'custom', message: VALIDATION.urlScheme });
      return z.NEVER;
    }
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname) {
      ctx.addIssue({ code: 'custom', message: VALIDATION.urlScheme });
      return z.NEVER;
    }
    if (url.username || url.password) {
      ctx.addIssue({ code: 'custom', message: 'Leave the username and password out of the link' });
      return z.NEVER;
    }
    return url.href;
  })
  .pipe(z.string().max(LINK_BIO_URL_MAX));

export const linkBioButtonInputSchema = z.object({
  label: requiredLine(LINK_BIO_LABEL_MAX).refine((label) => !TAG.test(label), NO_TAGS),
  url: linkBioUrlSchema,
});
export type LinkBioButtonInput = z.infer<typeof linkBioButtonInputSchema>;

// What the owner sees of a button.
export const myLinkBioButtonSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  order: z.number(),
});
export type MyLinkBioButton = z.infer<typeof myLinkBioButtonSchema>;

// ---- settings

// PUT /profile/me/link-bio. The five "show" switches are for the optional buttons; each one only has
// an effect while the feature behind it is on.
export const linkBioSettingsSchema = z.object({
  linkBioEnabled: z.boolean(),
  linkBioStyle: linkBioStyleSchema,
  linkBioShowContact: z.boolean(),
  linkBioShowVcard: z.boolean(),
  linkBioShowResume: z.boolean(),
  linkBioShowShare: z.boolean(),
  linkBioShowWork: z.boolean(),
});
export type LinkBioSettings = z.infer<typeof linkBioSettingsSchema>;

export const LINK_BIO_SETTING_KEYS = Object.keys(
  linkBioSettingsSchema.shape,
) as (keyof LinkBioSettings)[];
