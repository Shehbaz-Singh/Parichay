import { Router } from 'express';
import {
  CONTACT_HONEYPOT_FIELD,
  HONEYPOT_FIELD,
  contactSubmissionSchema,
  testimonialSubmissionSchema,
} from '@parichay/shared';
import {
  getContactForm,
  getLinkCard,
  getPublicPost,
  getPublicPosts,
  getPublicProfile,
  getSiteInfo,
  getSitemapLocales,
  getSitemapPages,
  getSitemapPosts,
  submitContact,
  submitTestimonial,
} from '../controllers/public.controller';
import { honeypot } from '../middleware/honeypot';
import { testimonialLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

// No authentication: this is what the public /[username] page reads and posts to.
export const publicRouter = Router();

// Not a slug (they cannot start with an underscore), so it cannot clash with one.
publicRouter.get('/_info', getSiteInfo);
publicRouter.get('/_posts', getSitemapPosts);
publicRouter.get('/_locales', getSitemapLocales);
publicRouter.get('/_pages', getSitemapPages);
publicRouter.get('/:slug', getPublicProfile);
publicRouter.get('/:slug/posts', getPublicPosts);
publicRouter.get('/:slug/links', getLinkCard);
publicRouter.get('/:slug/posts/:postSlug', getPublicPost);
// Rate limit first, then the honeypot (a bot's request is dropped before it is read), then the
// body is validated.
// The contact form: GET hands out the signed time stamp when the form opens, POST sends the message.
// The honeypot comes before validation so a bot's request is dropped unread; the other layers
// (time stamp, CAPTCHA, limits, duplicates) are in the service.
publicRouter.get('/:slug/contact', getContactForm);
publicRouter.post(
  '/:slug/contact',
  honeypot(CONTACT_HONEYPOT_FIELD),
  validateBody(contactSubmissionSchema),
  submitContact,
);
publicRouter.post(
  '/:slug/testimonials',
  testimonialLimiter,
  honeypot(HONEYPOT_FIELD),
  validateBody(testimonialSubmissionSchema),
  submitTestimonial,
);
