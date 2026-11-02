import type { Request, Response } from 'express';
import type { ContactListQuery, ContactSettings, ContactStatus } from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { getProfileId } from '../middleware/auth';
import * as service from '../services/contact.service';

// @types/express types route params as string | string[], but Express 4 always gives a string.
const idOf = (req: Request) => req.params.id as string;

// The query string has been validated by validateQuery().
const queryOf = (res: Response) => res.locals.query as ContactListQuery;

export const listMessages = asyncHandler(async (req, res) => {
  res.json(await service.list(getProfileId(req), queryOf(res)));
});

export const getUnreadMessages = asyncHandler(async (req, res) => {
  res.json(await service.unreadCount(getProfileId(req)));
});

export const getMessage = asyncHandler(async (req, res) => {
  res.json(await service.get(getProfileId(req), idOf(req)));
});

export const updateMessageStatus = asyncHandler(async (req, res) => {
  const { status } = req.body as { status: ContactStatus };
  res.json(await service.setStatus(getProfileId(req), idOf(req), status));
});

export const deleteMessage = asyncHandler(async (req, res) => {
  await service.remove(getProfileId(req), idOf(req));
  res.status(204).end();
});

export const saveContactSettings = asyncHandler(async (req, res) => {
  res.json(await service.saveSettings(getProfileId(req), req.body as ContactSettings));
});
