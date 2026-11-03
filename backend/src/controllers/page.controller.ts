import type { Request } from 'express';
import type {
  CustomPageInput,
  PagesUpdateInput,
  ProjectImageInput,
  ReorderInput,
} from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import { ERRORS } from '../lib/messages';
import { getProfileId } from '../middleware/auth';
import * as customPages from '../services/custom-page.service';
import * as layout from '../services/page-layout.service';
import * as images from '../services/project-image.service';

// @types/express types route params as string | string[], but Express 4 always gives a string.
const id = (req: Request) => req.params.id as string;
const imageId = (req: Request) => req.params.imageId as string;

// req.body has already been validated and parsed by validateBody().

// ---- the layout mode and the page list
export const getMyPages = asyncHandler(async (req, res) => {
  res.json(await layout.getPages(getProfileId(req)));
});

export const updateMyPages = asyncHandler(async (req, res) => {
  res.json(await layout.updatePages(getProfileId(req), req.body as PagesUpdateInput));
});

// ---- the pages the owner made
export const listCustomPages = asyncHandler(async (req, res) => {
  res.json(await customPages.listPages(getProfileId(req)));
});

export const createCustomPage = asyncHandler(async (req, res) => {
  res
    .status(201)
    .json(await customPages.createPage(getProfileId(req), req.body as CustomPageInput));
});

export const updateCustomPage = asyncHandler(async (req, res) => {
  res.json(await customPages.updatePage(getProfileId(req), id(req), req.body as CustomPageInput));
});

export const deleteCustomPage = asyncHandler(async (req, res) => {
  res.json(await customPages.deletePage(getProfileId(req), id(req)));
});

// ---- a project's cover and gallery (multipart fields "cover" and "image", set by the upload middleware)
export const uploadProjectCover = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', ERRORS.attachCover);
  res.json(await images.replaceCover(getProfileId(req), id(req), req.file.buffer));
});

export const deleteProjectCover = asyncHandler(async (req, res) => {
  await images.removeCover(getProfileId(req), id(req));
  res.status(204).end();
});

export const uploadProjectImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', ERRORS.attachImage);
  res.status(201).json(await images.addImage(getProfileId(req), id(req), req.file.buffer));
});

export const updateProjectImage = asyncHandler(async (req, res) => {
  res.json(
    await images.updateImage(
      getProfileId(req),
      id(req),
      imageId(req),
      req.body as ProjectImageInput,
    ),
  );
});

export const deleteProjectImage = asyncHandler(async (req, res) => {
  await images.removeImage(getProfileId(req), id(req), imageId(req));
  res.status(204).end();
});

export const reorderProjectImages = asyncHandler(async (req, res) => {
  res.json(await images.reorderImages(getProfileId(req), id(req), (req.body as ReorderInput).ids));
});
