import type { Request } from 'express';
import type { LinkBioButtonInput, LinkBioSettings, ReorderInput } from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { getProfileId } from '../middleware/auth';
import * as service from '../services/link-bio.service';

// @types/express types route params as string | string[], but Express 4 always gives a string.
const idOf = (req: Request) => req.params.id as string;

// req.body has already been validated and parsed by validateBody().
export const listLinkBioButtons = asyncHandler(async (req, res) => {
  res.json(await service.list(getProfileId(req)));
});

export const createLinkBioButton = asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(getProfileId(req), req.body as LinkBioButtonInput));
});

export const updateLinkBioButton = asyncHandler(async (req, res) => {
  res.json(await service.update(getProfileId(req), idOf(req), req.body as LinkBioButtonInput));
});

export const deleteLinkBioButton = asyncHandler(async (req, res) => {
  await service.remove(getProfileId(req), idOf(req));
  res.status(204).end();
});

export const reorderLinkBioButtons = asyncHandler(async (req, res) => {
  const { ids } = req.body as ReorderInput;
  res.json(await service.reorder(getProfileId(req), ids));
});

export const saveLinkBioSettings = asyncHandler(async (req, res) => {
  res.json(await service.saveSettings(getProfileId(req), req.body as LinkBioSettings));
});
