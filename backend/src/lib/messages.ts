// Every message the API sends in an error response. A route, service or middleware names the message
// here instead of writing it inline, so the wording lives in one place. Messages that depend on a
// value are small functions. Validation messages of the shared schemas live in @parichay/shared.

import { IMAGE_MAX_BYTES, RESUME_MAX_BYTES, megabytes } from '@parichay/shared';

export const ERRORS = {
  // ---- general
  authRequired: 'Authentication required',
  notFound: 'Not found',
  routeNotFound: (method: string, path: string) => `Route not found: ${method} ${path}`,
  invalidData: 'Invalid request data',
  invalidJson: 'Request body is not valid JSON',
  bodyTooLarge: 'Request body is too large',
  rateLimited: 'Too many attempts, please try again later',

  // ---- sign-in and tokens
  invalidCredentials: 'Invalid email or password',
  incorrectPassword: 'Incorrect password',
  emailTaken: 'An account with this email already exists',
  invalidToken: 'Invalid token',
  tokenExpired: 'Token has expired',
  missingAuthHeader: 'Missing or malformed Authorization header',
  accountGone: 'Account no longer exists',

  // ---- things that were not found
  profileNotFound: 'Profile not found',
  postNotFound: 'Post not found',
  languageNotFound: 'Language not found',
  sectionNotFound: 'Unknown section',
  customPageNotFound: 'Page not found',
  projectImageNotFound: 'Image not found',
  customSectionNotFound: 'Custom section not found',
  itemNotFound: 'Item not found',
  testimonialNotFound: 'Testimonial not found',
  messageNotFound: 'Message not found',
  linkBioButtonNotFound: 'Button not found',

  // ---- limits and conflicts
  slugTaken: 'This slug is already taken',
  maxPosts: (max: number) => `You can have at most ${max} posts`,
  maxCustomSections: (max: number) => `You can have at most ${max} custom sections`,
  maxCustomItems: (max: number) => `You can have at most ${max} items in a section`,
  maxSectionItems: (max: number, section: string) =>
    `You can have at most ${max} items in ${section}`,
  maxCustomPages: (max: number) => `You can have at most ${max} extra pages`,
  maxProjectImages: (max: number) => `A project can have at most ${max} gallery images`,
  pageSlugTaken: 'You already have a page with this address',
  projectSlugTaken: 'You already have a project with this address',
  maxFeatured: (max: number) => `You can feature at most ${max} projects`,
  linkBioLimit: (max: number) => `You can have at most ${max} buttons on your link-in-bio card`,
  linkBioNeedsPublish: 'Publish your page before you switch on the link-in-bio card',
  testimonialLimit: 'No more testimonials can be added right now',
  testimonialsClosed: 'This person is not accepting testimonials',
  reorderCustomItems: 'ids must list every item in the section exactly once',
  reorderSection: (section: string) => `ids must list every item in ${section} exactly once`,
  reorderLinkBio: 'ids must list every link-in-bio button exactly once',
  reorderTestimonials: 'ids must list every approved testimonial exactly once',

  // ---- contact form (what a visitor can be told is kept deliberately vague)
  contactBusy: 'Too many messages right now. Please try again later.',
  contactExpired: 'This form has timed out. Please reload the page and try again.',
  contactCaptcha: 'We could not check that you are a person. Please try again.',

  // ---- working together card
  timeZoneForCard: 'Choose a time zone to show the Working together card',
  timeZoneField: 'Choose a time zone',
  contactNotVisible: 'That contact option is not one of your visible links',
  contactNotVisibleField: 'Add and show that link first, or choose another way to be reached',

  // ---- uploads
  imageTypes: 'Only JPG, PNG and WebP images are allowed',
  imageTooLarge: `Image must be ${megabytes(IMAGE_MAX_BYTES)} or smaller`,
  imageUploadFailed: 'Could not upload the image, please try again',
  sendAvatar: 'Send one image in the "avatar" form field',
  sendCover: 'Send one image in the "cover" form field',
  sendImage: 'Send one image in the "image" form field',
  attachImage: 'Attach an image in the "image" form field',
  sendResume: 'Send one PDF in the "resume" form field',
  attachAvatar: 'Attach an image in the "avatar" form field',
  attachCover: 'Attach an image in the "cover" form field',
  attachResume: 'Attach a PDF in the "resume" form field',
  pdfOnly: 'Only PDF files are supported',
  pdfTooLarge: `The PDF must be ${megabytes(RESUME_MAX_BYTES)} or smaller`,

  // ---- resume import
  pdfUnreadable: "We couldn't read that PDF. It may be damaged or password protected.",
  pdfNoText:
    'That PDF has no readable text. Scanned resumes are not supported; export a PDF with selectable text.',
  resumeUnavailable:
    'Resume import is not available right now. You can fill in your details by hand.',
  resumeBusy: 'The reading service is busy. Please try again in a minute.',
  resumeTimeout: 'Reading your resume took too long. Please try again.',
  resumeParseFailed: "We couldn't make sense of that resume. Please try again.",
  resumeNothingFound: "We couldn't find resume details in that file.",

  // ---- languages and translations
  confirmRepeatCode: 'Confirm by repeating the language code in the "confirm" query parameter',
  languageNotEnabled: 'Add this language first',
  textGone: 'One of the texts no longer exists',
  languageIsDefault: 'That is already your main language',
  languageExists: 'That language is already added',
  languageLimit: (max: number) => `You can add up to ${max} languages besides your main one`,
  languagesInUse: 'Remove your other languages before changing your main language',

  // ---- translation suggestions
  notTranslatable: 'Not translatable',
  nothingToTranslate: 'There is no text to translate here',
  suggestionsUnavailable: 'Translation suggestions are not available',
  suggestionLimit: (perDay: number) =>
    `You have used today's ${perDay} translation suggestions. Try again tomorrow, or write the text yourself.`,
  suggestionsBusy: 'The translation service is busy. Try again in a minute.',
  suggestionsTimeout: 'The translation took too long. Please try again.',
  suggestionFailed: "We couldn't get a usable translation. Please try again.",
  suggestionTooLong: (max: number) =>
    `The suggestion was longer than the ${max} character limit. Write it yourself, or shorten the original.`,
} as const;
