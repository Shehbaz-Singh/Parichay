import type { Request } from 'express';
import {
  isLocaleCode,
  slugFormatSchema,
  type ContactSubmission,
  type TestimonialInput,
} from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { config, turnstile } from '../lib/config';
import { AppError } from '../lib/errors';
import { clientKey } from '../middleware/rate-limit';
import * as linkCardService from '../services/link-card.service';
import * as contactService from '../services/contact.service';
import * as publicService from '../services/public.service';
import * as testimonialService from '../services/testimonial.service';
import { ERRORS } from '../lib/messages';

// Short cache: edits show up within a minute, while a busy portfolio does not hit the
// database on every view. Express also adds an ETag, so revalidation costs a 304.
const CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

// Anything that cannot be a valid slug (including reserved words) cannot be a profile.
function slugOf(req: Request) {
  const slug = slugFormatSchema.safeParse(req.params.slug as string);
  if (!slug.success) throw AppError.notFound(ERRORS.profileNotFound);
  return slug.data;
}

// ?lang=xx. Anything that is not a known language code is a language that is not offered.
function langOf(req: Request) {
  const lang = req.query.lang;
  if (lang === undefined) return undefined;
  if (typeof lang !== 'string' || !isLocaleCode(lang))
    throw AppError.notFound(ERRORS.profileNotFound);
  return lang;
}

export const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await publicService.getPublicProfile(slugOf(req), langOf(req));
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(profile);
});

// The body has been validated by validateBody(); it always lands as pending review.
export const submitTestimonial = asyncHandler(async (req, res) => {
  await testimonialService.submit(slugOf(req), req.body as TestimonialInput);
  res.status(201).json({ received: true });
});

export const getLinkCard = asyncHandler(async (req, res) => {
  const card = await linkCardService.getLinkCard(slugOf(req), langOf(req));
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(card);
});

// What the contact form needs when it opens (a signed time stamp, and the Turnstile key if there is
// one). Never cached: the stamp is what proves the form was open for a moment.
export const getContactForm = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await contactService.formInfo(slugOf(req)));
});

// The body has been validated by validateBody() and the honeypot has already been checked. The
// visitor is identified only by their address, for the in-memory limit (see lib/visitor-limit.ts).
export const submitContact = asyncHandler(async (req, res) => {
  res
    .status(201)
    .json(await contactService.submit(slugOf(req), req.body as ContactSubmission, clientKey(req)));
});

// What the privacy page needs to say accurately: which AI service reads uploaded resumes (null when
// resume import is not set up, so the page does not claim a provider that is not in use), how long
// contact messages are kept, and the CAPTCHA the contact form uses (null when there is none).
export const getSiteInfo = asyncHandler(async (_req, res) => {
  const provider = !config.LLM_API_KEY
    ? null
    : config.LLM_PROVIDER === 'gemini'
      ? 'Google (Gemini API)'
      : config.LLM_BASE_URL
        ? 'an OpenAI-compatible AI service'
        : 'OpenAI';
  res.json({
    aiProvider: provider,
    contactRetentionDays: config.CONTACT_RETENTION_DAYS,
    captchaProvider: turnstile ? 'Cloudflare Turnstile' : null,
  });
});

// Post slugs are made by the API from a title: lowercase letters, digits and single hyphens.
const POST_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const getPublicPosts = asyncHandler(async (req, res) => {
  const posts = await publicService.getPublicPosts(slugOf(req), langOf(req));
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(posts);
});

export const getPublicPost = asyncHandler(async (req, res) => {
  const postSlug = req.params.postSlug as string;
  if (postSlug.length > 80 || !POST_SLUG.test(postSlug))
    throw AppError.notFound(ERRORS.postNotFound);
  const post = await publicService.getPublicPost(slugOf(req), postSlug, langOf(req));
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(post);
});

export const getSitemapPosts = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(await publicService.getPostsForSitemap());
});

export const getSitemapLocales = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(await publicService.getLocalesForSitemap());
});
