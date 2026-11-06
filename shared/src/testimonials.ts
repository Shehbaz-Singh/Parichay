import { z } from 'zod';
import {
  EMAIL_MAX,
  NO_TAGS,
  isPlain as plain,
  optionalLine,
  requiredBlock,
  requiredLine,
} from './text';
import { VALIDATION } from './messages';

// Testimonials: quotes about the profile's owner. A visitor can submit one when the owner accepts
// them; it waits as "pending" until the owner approves it. Only approved ones are public, and the
// contact email is for the owner only.

export const TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const testimonialStatusSchema = z.enum(TESTIMONIAL_STATUSES);
export type TestimonialStatus = z.infer<typeof testimonialStatusSchema>;

export const TESTIMONIAL_NAME_MIN = 2;
export const TESTIMONIAL_NAME_MAX = 80;
export const TESTIMONIAL_ROLE_MAX = 100;
export const TESTIMONIAL_COMPANY_MAX = 100;
export const TESTIMONIAL_MESSAGE_MIN = 20;
export const TESTIMONIAL_MESSAGE_MAX = 800;
export const TESTIMONIAL_EMAIL_MAX = EMAIL_MAX;

// Keeps the table and the owner's list manageable, however many people submit.
export const MAX_TESTIMONIALS = 100; // all statuses, per profile
export const MAX_PENDING_TESTIMONIALS = 50; // waiting for review, per profile

const optionalEmail = z
  .string()
  .trim()
  .max(TESTIMONIAL_EMAIL_MAX)
  .nullish()
  .transform((email) => email || null)
  .pipe(z.string().email(VALIDATION.emailInvalid).nullable());

// What the owner types when adding or editing one, and what a visitor submits.
export const testimonialInputSchema = z.object({
  authorName: requiredLine(TESTIMONIAL_NAME_MAX, TESTIMONIAL_NAME_MIN).refine(plain, NO_TAGS),
  authorRole: optionalLine(TESTIMONIAL_ROLE_MAX).refine(plain, NO_TAGS),
  authorCompany: optionalLine(TESTIMONIAL_COMPANY_MAX).refine(plain, NO_TAGS),
  message: requiredBlock(TESTIMONIAL_MESSAGE_MAX, TESTIMONIAL_MESSAGE_MIN).refine(plain, NO_TAGS),
  contactEmail: optionalEmail,
});
export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

// POST /public/:slug/testimonials. `website` is the honeypot: it is hidden on the form, so a real
// person leaves it empty, and a submission that fills it in is thrown away without an error.
export const HONEYPOT_FIELD = 'website';
export const testimonialSubmissionSchema = testimonialInputSchema.extend({
  [HONEYPOT_FIELD]: z.string().max(500).optional(),
});
export type TestimonialSubmission = z.infer<typeof testimonialSubmissionSchema>;

// PUT /profile/me/testimonials/settings
export const testimonialSettingsSchema = z.object({ acceptTestimonials: z.boolean() });
export type TestimonialSettings = z.infer<typeof testimonialSettingsSchema>;

// What a visitor sees of an approved testimonial: never the email, status or date.
export const publicTestimonialSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  authorRole: z.string().nullable(),
  authorCompany: z.string().nullable(),
  message: z.string(),
  order: z.number(),
});

// What the owner sees of any testimonial.
export const myTestimonialSchema = publicTestimonialSchema.extend({
  contactEmail: z.string().nullable(),
  status: testimonialStatusSchema,
  createdAt: z.string(),
});
export type MyTestimonial = z.infer<typeof myTestimonialSchema>;
