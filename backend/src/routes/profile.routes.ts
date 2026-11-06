import { Router } from 'express';
import {
  addLanguageSchema,
  announcementSettingsSchema,
  contactListQuerySchema,
  contactSettingsSchema,
  contactStatusUpdateSchema,
  customPageInputSchema,
  customItemInputSchema,
  customSectionInputSchema,
  postInputSchema,
  profileUpdateSchema,
  publishSchema,
  reorderSchema,
  languageSettingsSchema,
  pagesUpdateSchema,
  projectImageInputSchema,
  linkBioButtonInputSchema,
  linkBioSettingsSchema,
  sectionsUpdateSchema,
  suggestRequestSchema,
  testimonialInputSchema,
  testimonialSettingsSchema,
  translationsSaveSchema,
} from '@parichay/shared';
import {
  createCustomItem,
  createCustomSection,
  deleteCustomItem,
  deleteCustomSection,
  getCustomItem,
  listCustomItems,
  listCustomSections,
  reorderCustomItems,
  updateCustomItem,
  updateCustomSection,
} from '../controllers/custom-section.controller';
import {
  createCustomPage,
  deleteCustomPage,
  deleteProjectCover,
  deleteProjectImage,
  getMyPages,
  listCustomPages,
  reorderProjectImages,
  updateCustomPage,
  updateMyPages,
  updateProjectImage,
  uploadProjectCover,
  uploadProjectImage,
} from '../controllers/page.controller';
import {
  createLinkBioButton,
  deleteLinkBioButton,
  listLinkBioButtons,
  reorderLinkBioButtons,
  saveLinkBioSettings,
  updateLinkBioButton,
} from '../controllers/link-bio.controller';
import {
  deleteMessage,
  getMessage,
  getUnreadMessages,
  listMessages,
  saveContactSettings,
  updateMessageStatus,
} from '../controllers/message.controller';
import {
  deleteMyAvatar,
  exportMyData,
  getMyProfile,
  getMySections,
  parseMyResume,
  publishMyProfile,
  saveMyAnnouncement,
  updateMyProfile,
  updateMySections,
  uploadMyAvatar,
} from '../controllers/profile.controller';
import {
  createSectionItem,
  deleteSectionItem,
  getSectionItem,
  listSection,
  reorderSection,
  updateSectionItem,
} from '../controllers/section.controller';
import {
  approveTestimonial,
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  rejectTestimonial,
  reorderTestimonials,
  updateTestimonial,
  updateTestimonialSettings,
} from '../controllers/testimonial.controller';
import {
  createPost,
  deleteCover,
  deletePost,
  getPost,
  listPosts,
  updatePost,
  uploadCover,
} from '../controllers/post.controller';
import {
  addLanguage,
  getLanguages,
  getTranslations,
  removeLanguage,
  saveTranslations,
  setDefaultLanguage,
  suggestTranslation,
} from '../controllers/translation.controller';
import { requireAuth } from '../middleware/auth';
import { resumeLimiter, uploadLimiter } from '../middleware/rate-limit';
import { avatarUpload, coverUpload, imageUpload, resumeUpload } from '../middleware/upload';
import { sectionParam, validateSectionBody } from '../middleware/section';
import { validateBody, validateQuery } from '../middleware/validate';

export const profileRouter = Router();

// Everything here belongs to the signed-in user.
profileRouter.use(requireAuth);
profileRouter.param('section', sectionParam);

profileRouter.get('/me', getMyProfile);
profileRouter.put('/me', validateBody(profileUpdateSchema), updateMyProfile);
// Declared before /me/:section so "publish" and "avatar" are not read as section names.
profileRouter.get('/me/export', exportMyData);
profileRouter.post('/me/publish', validateBody(publishSchema), publishMyProfile);
// Auth has already run (router-level), so unauthenticated uploads are rejected before any
// bytes are read. Then: rate limit, multipart parse (2 MB, jpg/png/webp), upload.
profileRouter.post('/me/avatar', uploadLimiter, avatarUpload, uploadMyAvatar);
profileRouter.delete('/me/avatar', deleteMyAvatar);
// Reads a resume PDF and returns the parsed data. Declared before /me/:section like the others.
profileRouter.post('/me/resume', resumeLimiter, resumeUpload, parseMyResume);

// The announcement bar: all of its settings in one request. Declared before /me/:section like the others.
profileRouter.put('/me/announcement', validateBody(announcementSettingsSchema), saveMyAnnouncement);

// Layout of the page: which sections show, in what order, under what heading. Declared before
// /me/:section like the others, so "sections" is not read as a section name.
profileRouter.get('/me/sections', getMySections);
profileRouter.put('/me/sections', validateBody(sectionsUpdateSchema), updateMySections);

// Multi-page mode: the layout switch with the page list, the pages the owner made, and a project's
// cover and gallery. Declared before /me/:section like the others.
profileRouter.get('/me/pages', getMyPages);
profileRouter.put('/me/pages', validateBody(pagesUpdateSchema), updateMyPages);
profileRouter.get('/me/custom-pages', listCustomPages);
profileRouter.post('/me/custom-pages', validateBody(customPageInputSchema), createCustomPage);
profileRouter.put('/me/custom-pages/:id', validateBody(customPageInputSchema), updateCustomPage);
profileRouter.delete('/me/custom-pages/:id', deleteCustomPage);
profileRouter.post('/me/projects/:id/cover', uploadLimiter, coverUpload, uploadProjectCover);
profileRouter.delete('/me/projects/:id/cover', deleteProjectCover);
profileRouter.post('/me/projects/:id/images', uploadLimiter, imageUpload, uploadProjectImage);
profileRouter.patch(
  '/me/projects/:id/images/reorder',
  validateBody(reorderSchema),
  reorderProjectImages,
);
profileRouter.put(
  '/me/projects/:id/images/:imageId',
  validateBody(projectImageInputSchema),
  updateProjectImage,
);
profileRouter.delete('/me/projects/:id/images/:imageId', deleteProjectImage);

// Sections the user made up, and their items. Also declared before /me/:section. The items'
// reorder route comes before /items/:itemId so "reorder" is not read as an item id.
profileRouter.get('/me/custom-sections', listCustomSections);
profileRouter.post(
  '/me/custom-sections',
  validateBody(customSectionInputSchema),
  createCustomSection,
);
profileRouter.put(
  '/me/custom-sections/:id',
  validateBody(customSectionInputSchema),
  updateCustomSection,
);
profileRouter.delete('/me/custom-sections/:id', deleteCustomSection);
profileRouter.get('/me/custom-sections/:id/items', listCustomItems);
profileRouter.post(
  '/me/custom-sections/:id/items',
  validateBody(customItemInputSchema),
  createCustomItem,
);
profileRouter.patch(
  '/me/custom-sections/:id/items/reorder',
  validateBody(reorderSchema),
  reorderCustomItems,
);
profileRouter.get('/me/custom-sections/:id/items/:itemId', getCustomItem);
profileRouter.put(
  '/me/custom-sections/:id/items/:itemId',
  validateBody(customItemInputSchema),
  updateCustomItem,
);
profileRouter.delete('/me/custom-sections/:id/items/:itemId', deleteCustomItem);

// Testimonials people left, and the ones added by hand. Declared before /me/:section like the
// others; "settings" and "reorder" come before /:id so they are not read as an id.
profileRouter.get('/me/testimonials', listTestimonials);
profileRouter.post('/me/testimonials', validateBody(testimonialInputSchema), createTestimonial);
profileRouter.put(
  '/me/testimonials/settings',
  validateBody(testimonialSettingsSchema),
  updateTestimonialSettings,
);
profileRouter.patch('/me/testimonials/reorder', validateBody(reorderSchema), reorderTestimonials);
profileRouter.put('/me/testimonials/:id', validateBody(testimonialInputSchema), updateTestimonial);
profileRouter.post('/me/testimonials/:id/approve', approveTestimonial);
profileRouter.post('/me/testimonials/:id/reject', rejectTestimonial);
profileRouter.delete('/me/testimonials/:id', deleteTestimonial);

// The contact form's inbox. Declared before /me/:section like the others; "unread-count" and
// "settings" come before /:id so they are not read as an id.
profileRouter.get('/me/messages', validateQuery(contactListQuerySchema), listMessages);
profileRouter.get('/me/messages/unread-count', getUnreadMessages);
profileRouter.put(
  '/me/messages/settings',
  validateBody(contactSettingsSchema),
  saveContactSettings,
);
profileRouter.get('/me/messages/:id', getMessage);
profileRouter.patch(
  '/me/messages/:id',
  validateBody(contactStatusUpdateSchema),
  updateMessageStatus,
);
profileRouter.delete('/me/messages/:id', deleteMessage);

// The link-in-bio card: its settings and its custom buttons. Declared before /me/:section like the
// others; "reorder" comes before /:id so it is not read as an id.
profileRouter.put('/me/link-bio', validateBody(linkBioSettingsSchema), saveLinkBioSettings);
profileRouter.get('/me/link-bio/links', listLinkBioButtons);
profileRouter.post(
  '/me/link-bio/links',
  validateBody(linkBioButtonInputSchema),
  createLinkBioButton,
);
profileRouter.patch(
  '/me/link-bio/links/reorder',
  validateBody(reorderSchema),
  reorderLinkBioButtons,
);
profileRouter.put(
  '/me/link-bio/links/:id',
  validateBody(linkBioButtonInputSchema),
  updateLinkBioButton,
);
profileRouter.delete('/me/link-bio/links/:id', deleteLinkBioButton);

// Writing: posts and links to articles. Declared before /me/:section like the others. The cover
// image has its own upload, with the same limits and rate limit as the avatar.
profileRouter.get('/me/posts', listPosts);
profileRouter.post('/me/posts', validateBody(postInputSchema), createPost);
profileRouter.get('/me/posts/:id', getPost);
profileRouter.put('/me/posts/:id', validateBody(postInputSchema), updatePost);
profileRouter.delete('/me/posts/:id', deletePost);
profileRouter.post('/me/posts/:id/cover', uploadLimiter, coverUpload, uploadCover);
profileRouter.delete('/me/posts/:id/cover', deleteCover);

// Languages: which ones the page is offered in, and the translated texts of each. Declared before
// /me/:section like the others.
profileRouter.get('/me/languages', getLanguages);
profileRouter.post('/me/languages', validateBody(addLanguageSchema), addLanguage);
profileRouter.put('/me/languages', validateBody(languageSettingsSchema), setDefaultLanguage);
profileRouter.delete('/me/languages/:locale', removeLanguage);
profileRouter.post(
  '/me/translations/suggest',
  validateBody(suggestRequestSchema),
  suggestTranslation,
);
profileRouter.get('/me/translations/:locale', getTranslations);
profileRouter.put(
  '/me/translations/:locale',
  validateBody(translationsSaveSchema),
  saveTranslations,
);

// :section is one of experience | education | projects | skills | links
profileRouter.patch('/me/:section/reorder', validateBody(reorderSchema), reorderSection);
profileRouter.get('/me/:section', listSection);
profileRouter.post('/me/:section', validateSectionBody, createSectionItem);
profileRouter.get('/me/:section/:id', getSectionItem);
profileRouter.put('/me/:section/:id', validateSectionBody, updateSectionItem);
profileRouter.delete('/me/:section/:id', deleteSectionItem);
