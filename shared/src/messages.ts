// Every validation message the shared schemas produce. The API returns these as they are and the
// dashboard shows them next to the field, so a message is written once here and reads the same
// on both sides. Messages that depend on a value are small functions.

export const VALIDATION = {
  // text.ts
  tooShort: (min: number) => `Use at least ${min} characters`,
  tooLong: (max: number) => `Use ${max} characters or fewer`,

  // auth.ts
  passwordShort: 'Password must be at least 8 characters',
  passwordBytes: 'Password must be at most 72 bytes',
  termsRequired: 'Please agree to the Terms and Privacy Policy to continue',
  passwordRequired: 'Password is required',
  currentPasswordRequired: 'Current password is required',
  passwordReused: 'Choose a password you have not used just now',

  // portfolio.ts
  urlScheme: 'Must start with http:// or https://',
  slugFormat: 'Use lowercase letters, numbers and single hyphens',
  hexColor: 'Use a hex color like #2563eb',
  endBeforeStart: 'End date must not be before the start date',

  // custom-sections.ts
  startBeforeEnd: 'Add a start date before an end date',

  // posts.ts
  postBodyRequired: 'Write something before you publish, or save it as a draft',
  postLinkRequired: 'Add the link to the article before you publish, or save it as a draft',

  // section-config.ts
  sectionRepeated: (key: string) => `Each section can appear only once (${key} is repeated)`,

  // pages.ts
  pageRepeated: 'Each page can appear only once',
  pageSlugReserved: 'This address is reserved, choose another',

  // testimonials.ts
  emailInvalid: 'Enter a valid email address',

  // announcement.ts
  dateInvalid: 'Enter a valid date and time',
  announcementTextRequired: 'Write the announcement before you turn it on',
  announcementLinkNeedsText: 'Add the announcement text before adding a link',
  announcementEndTooFar: 'The end cannot be more than 12 months from now',

  // translations.ts
  notTranslatable: 'This field cannot be translated',

  // work-card.ts
  timeZoneUnknown: 'Choose a time zone from the list',
  timeFormat: 'Use a 24-hour time like 09:30',
  rangeEndAfterStart: 'The end must be after the start',
  tooManyRanges: 'Use at most two time ranges a day',
  rangesOverlap: 'The second range must start after the first one ends',
} as const;
