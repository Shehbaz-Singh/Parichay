// The dashboard's own messages: toasts, error text and the sentences of confirm dialogs. They are
// named here instead of written where they are shown, so the wording lives in one place. Messages
// that depend on a value are small functions. Validation messages that come from the shared
// schemas live in @parichay/shared, and the public portfolio's text in lib/i18n/messages.

import { IMAGE_MAX_BYTES, RESUME_PROXY_MAX_BYTES, megabytes } from '@parichay/shared';

export const NOTICES = {
  saved: 'Saved.',
  deleted: 'Deleted.',
  changesSaved: 'Changes saved.',
  draftSaved: 'Draft saved.',
  published: 'Published. It shows on your page while the Writing section is switched on.',
  shareMessageSaved: 'Share message saved.',
  portfolioLive: 'Your portfolio is live again.',
  portfolioHidden:
    'Your portfolio is hidden. Only you can see it now, and you can publish it again any time.',
  slugSaved: 'Page address saved.',
  photoRemoved: 'Photo removed. Your initials will show instead.',
  photoUp: 'Looking good. Your photo is up.',
  coverSaved: 'Cover image saved.',
  coverRemoved: 'Cover image removed.',
  sectionAdded: 'Section added. Add items to it, and it appears on your page.',
  sectionDeleted: 'Section deleted.',
  importDone: 'Got it. Take a look through each tab, fix anything that’s off, then save.',
  dataDownloading: 'Your data file is downloading.',
  testimonialSaved: 'Testimonial saved.',
  testimonialAdded: 'Testimonial added to your page.',
  testimonialDeleted: 'Testimonial deleted.',
  testimonialsOff: 'No longer accepting testimonials.',
  testimonialsOn: 'Now accepting testimonials.',
  testimonialsShown: 'The Testimonials section is now shown on your page.',
  testimonialApproved: (name: string) => `Approved the testimonial from ${name}.`,
  testimonialRejected: (name: string) => `Rejected the testimonial from ${name}.`,
  testimonialRemoved: (name: string) => `Removed ${name}'s testimonial from your page.`,
  contactFormOn: 'The contact form is on. It shows on your page once it is published.',
  contactFormOff: 'The contact form is off. Visitors can no longer write to you.',
  contactFormShown: 'The Contact section is now shown on your page.',
  contactIntroSaved: 'Contact form intro saved.',
  messageDeleted: 'Message deleted.',
  messageSpam: 'Reported as spam and deleted.',
  messageArchived: 'Message archived.',
  messageMovedBack: 'Message moved back to your inbox.',
  messageMarkedRead: 'Marked as read.',
  messageMarkedUnread: 'Marked as unread.',
  emailCopied: (email: string) => `Copied ${email}.`,
  linkBioOn: 'The link-in-bio card is on. Anyone with the link can see it.',
  linkBioOff: 'The link-in-bio card is off. Its link now shows a “not found” page.',
  linkBioButtonAdded: 'Button added to your card.',
  linkBioButtonSaved: 'Button saved.',
  linkBioCopied: 'Copied the link to your card.',
  skillAdded: (name: string) => `Added ${name}.`,
  skillRemoved: (name: string) => `Removed ${name}.`,
  themeChanged: (name: string) => `Theme changed to ${name}.`,
  accentChanged: (name: string) => `Accent color changed to ${name}.`,
  mainLanguage: (name: string) => `Main language is now ${name}.`,
  languageAdded: (name: string) => `${name} added. Translate its texts below.`,
  languageRemoved: (name: string) => `${name} and its texts were deleted.`,
  signatureCopied: 'Copied. Paste it into your email signature box.',
  signatureHtmlCopied: 'Copied the HTML code.',
  signatureTextCopied: 'Copied the plain text version.',
  signatureDownloaded: 'Downloaded the signature as an .html file.',
  pageAdded: 'Page added. Put sections on it below, and it appears in your navigation.',
  pageSaved: 'Page saved.',
  pageDeleted: 'Page deleted. Its sections moved back to the standard pages.',
  layoutMulti: 'Your portfolio is now a site of pages.',
  layoutSingle: 'Your portfolio is one page again. Your page settings are kept.',
  splitApplied: 'Sections arranged into pages. Adjust them below.',
  projectCoverSaved: 'Cover image saved.',
  projectCoverRemoved: 'Cover image removed.',
  projectImageAdded: 'Image added to the gallery.',
  projectImageRemoved: 'Image removed from the gallery.',
} as const;

export const PROBLEMS = {
  generic: 'Something went wrong. Please try again.',
  notSaved: 'Something went wrong, and your change may not have been saved. Please try again.',
  tryAgain: 'That did not work. Please try again.',
  orderNotSaved: (reason: string) => `Couldn't save the new order. ${reason}`,
  dataFile: "We couldn't prepare your data file. Please try again.",
  themeNotChanged: "We couldn't change the theme. Please try again.",
  colorNotChanged: "We couldn't change the color. Please try again.",
  linkNotUpdated: "We couldn't update that link. Please try again.",
  copyEmail: "We couldn't copy the email address automatically. Select it and copy it by hand.",
  linkBioCopy: "We couldn't copy the link automatically. Select it and copy it by hand.",
  copyLink: "We couldn't copy the link automatically. Select it and copy it by hand.",
  signatureCopy:
    "We couldn't copy that automatically. Select the preview and copy it by hand, or download the .html file.",
  imageType: "That file type won't work. Choose a JPG, PNG or WebP image.",
  avatarTooLarge: `That image is over ${megabytes(IMAGE_MAX_BYTES)}. Choose a smaller one, or shrink it and try again.`,
  coverTooLarge: `That image is over ${megabytes(IMAGE_MAX_BYTES)}. Choose a smaller one, or shrink it first.`,
  notPdf: 'That doesn’t look like a PDF. Choose a PDF file, or fill in your details by hand.',
  pdfTooLarge: `That PDF is over ${megabytes(RESUME_PROXY_MAX_BYTES)}. Try a smaller or compressed version, or fill in your details by hand.`,
  pdfUnread: 'We couldn’t read that file. Try again, or fill in your details by hand.',
  sectionTitle: 'Enter a title (up to 80 characters).',
  passwordsDiffer: 'Those two passwords are different. Type the new one the same way twice.',
  saveFailed: 'We couldn’t save. Your changes are still here',
  imageOrderNotSaved: (reason: string) => `Couldn't save the new image order. ${reason}`,
  altNotSaved: (reason: string) => `Couldn't save the image description. ${reason}`,
} as const;

export const CONFIRMS = {
  leaveUnsaved: 'You have changes that are not saved. Leave and lose them?',
  discardPost: 'You have changes that are not saved. Go back to the list and lose them?',
  discardImport: 'Everything read from your resume will be thrown away.',
  deleteSection: (title: string, items: string) =>
    `Delete "${title}"${items}? This cannot be undone.`,
  deleteTestimonial: (name: string) =>
    `The testimonial from ${name} will be deleted. This cannot be undone.`,
  deleteMessage: (name: string) =>
    `The message from ${name} will be deleted for good. This cannot be undone.`,
  reportSpam: (name: string) =>
    `The message from ${name} will be deleted for good, as spam. This cannot be undone.`,
  switchToMulti:
    'Your portfolio becomes a short Home page plus a page for your work, one for your story and any you add. Your sections and everything you wrote stay as they are. Links keep working: an old link to a section such as /name#projects takes visitors to the right page. You can switch back at any time and nothing is lost.',
  switchToSingle:
    'Your portfolio goes back to one long page with every section on it. Your page settings are kept, so switching to pages again brings the same arrangement back. Links keep working: the page addresses send visitors to the matching section of your page, and your project pages stay.',
  deleteCustomPage: (title: string) =>
    `“${title}” will be deleted, and its text with it. Sections on it move back to the standard pages. This can’t be undone.`,
  deletePost: (title: string) =>
    `“${title}” will be removed for good, along with its cover image. This can’t be undone.`,
} as const;
