import { turnstile } from './config';

// Cloudflare Turnstile, when the server has keys for it. The visitor's address is not sent along.
// If Cloudflare cannot be reached the check fails, which the visitor sees as a generic "try again".
export const captchaSiteKey = () => turnstile?.siteKey ?? null;

export async function verifyCaptcha(response: string | undefined): Promise<boolean> {
  if (!turnstile) return true;
  if (!response) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: turnstile.secretKey, response }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    return ((await res.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}
