import type {
  AnnouncementSettings,
  ProfileUpdateInput,
  PublishInput,
  SectionsUpdateInput,
} from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import { getProfileId } from '../middleware/auth';
import * as announcementService from '../services/announcement.service';
import * as avatarService from '../services/avatar.service';
import * as exportService from '../services/export.service';
import * as profileService from '../services/profile.service';
import * as resumeService from '../services/resume.service';
import * as layoutService from '../services/section-layout.service';
import { ERRORS } from '../lib/messages';

// req.body has already been validated and parsed by validateBody().
export const getMyProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.getProfile(getProfileId(req)));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.updateProfile(getProfileId(req), req.body as ProfileUpdateInput));
});

export const getMySections = asyncHandler(async (req, res) => {
  res.json({ sections: await layoutService.getSections(getProfileId(req)) });
});

export const updateMySections = asyncHandler(async (req, res) => {
  const { sections } = req.body as SectionsUpdateInput;
  res.json({ sections: await layoutService.updateSections(getProfileId(req), sections) });
});

export const deleteMyAvatar = asyncHandler(async (req, res) => {
  await avatarService.removeAvatar(getProfileId(req));
  res.status(204).end();
});

// req.file is set by the avatarUpload middleware (multipart field "avatar").
export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', ERRORS.attachAvatar);
  res.json(await avatarService.replaceAvatar(getProfileId(req), req.file.buffer));
});

export const publishMyProfile = asyncHandler(async (req, res) => {
  const { published } = req.body as PublishInput;
  res.json(await profileService.setPublished(getProfileId(req), published));
});

// req.file is set by the resumeUpload middleware (multipart field "resume"). The result is
// returned for the person to review; nothing is saved here.
export const parseMyResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', ERRORS.attachResume);
  res.json(await resumeService.parseResume(req.file.buffer));
});

// A download, not a page: the browser saves it as a file. The slug in the name is lowercase letters,
// digits and hyphens only, so it is safe in a header.
export const exportMyData = asyncHandler(async (req, res) => {
  if (!req.user) throw AppError.unauthorized();
  const data = await exportService.exportAccountData(req.user.id);
  const slug = data.profile?.slug ?? 'account';
  res.setHeader('Content-Disposition', `attachment; filename="portfolio-data-${slug}.json"`);
  res.setHeader('Cache-Control', 'no-store');
  res.type('application/json').send(JSON.stringify(data, null, 2));
});

export const saveMyAnnouncement = asyncHandler(async (req, res) => {
  res.json(
    await announcementService.saveAnnouncement(getProfileId(req), req.body as AnnouncementSettings),
  );
});
