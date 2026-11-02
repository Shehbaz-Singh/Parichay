import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { config } from '../lib/config';
import { AppError } from '../lib/errors';
import { ERRORS } from '../lib/messages';
import { ERROR_CODES } from '@parichay/shared';

function fromFrontend(req: Request): boolean {
  const expected = config.PROXY_SECRET;
  const given = req.get('x-proxy-secret');
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function clientKey(req: Request): string {
  const forwarded = req.get('x-client-ip');
  const ip = fromFrontend(req) && forwarded && isIP(forwarded) ? forwarded : (req.ip ?? '');
  return ipKeyGenerator(ip);
}

function limiter(options: {
  windowMs: number;
  limit: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    keyGenerator: clientKey,
    ...options,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new AppError(429, ERROR_CODES.RATE_LIMITED, ERRORS.rateLimited)),
  });
}

// Only failed logins count, so normal use is never blocked but guessing passwords is.
export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const registerLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 10 });

// Each upload costs Cloudinary storage and transformation quota.
export const uploadLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 20 });

// Visitors leaving a testimonial: 3 an hour from one address. Only accepted submissions count, so
// fixing a typo and sending again is not punished.
export const testimonialLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  skipFailedRequests: true,
});

// Every import is a paid or quota-limited call to an LLM, and the route sits behind login, so
// the limit is per account (not per IP): one person cannot burn the quota, and people sharing
// an office network do not share a limit.
export const resumeLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user?.id ?? clientKey(req),
});
