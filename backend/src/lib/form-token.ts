import { createHmac, timingSafeEqual } from 'node:crypto';
import { CONTACT_MIN_SECONDS, CONTACT_TOKEN_MAX_SECONDS } from '@parichay/shared';
import { config } from './config';

// The token the contact form carries. It is the moment the form was shown, signed together with the
// page's address, so a script cannot invent one, reuse it on another page or make it look older.
// Nothing is stored: the server only needs to recognise its own signature. It is signed with a key
// derived from JWT_SECRET (not the secret itself), so a token is useless for anything else.
const key = createHmac('sha256', config.JWT_SECRET).update('contact-form-token').digest();

const sign = (slug: string, issuedAt: number) =>
  createHmac('sha256', key).update(`${slug}.${issuedAt}`).digest('base64url');

export function issueFormToken(slug: string, now = Date.now()): string {
  return `${now}.${sign(slug, now)}`;
}

// 'ok' when the form has been open long enough and not too long. 'early' is a form sent faster than a
// person writes (dropped without a word). 'invalid' covers a missing, damaged, foreign or stale token.
export type FormTokenResult = 'ok' | 'early' | 'invalid';

export function checkFormToken(slug: string, token: string, now = Date.now()): FormTokenResult {
  const [stamp, signature, ...extra] = token.split('.');
  if (!stamp || !signature || extra.length > 0 || !/^\d{10,16}$/.test(stamp)) return 'invalid';
  const issuedAt = Number(stamp);
  const expected = Buffer.from(sign(slug, issuedAt));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'invalid';

  const age = (now - issuedAt) / 1000;
  if (age < 0 || age > CONTACT_TOKEN_MAX_SECONDS) return 'invalid';
  return age < CONTACT_MIN_SECONDS ? 'early' : 'ok';
}
