import { NextResponse } from 'next/server';
import { isLocaleCode } from '@parichay/shared';
import { API_URL, PROXY_SECRET, SITE_URL } from '@/lib/config';
import { clientIp, createLimiter, tooManyRequests } from '@/lib/public-rate-limit';

export const runtime = 'nodejs';

// POST /<username>/contact/send[?lang=hi]: where the contact form posts when JavaScript is off (with
// JavaScript the form calls the API through /api instead). It passes the message to the API and sends
// the visitor back to the form's page (/<username>/contact), which says what happened. Nothing is kept
// here, and the visitor's address is only forwarded so the API can apply its limits.

const limited = createLimiter(60_000, 10);

const text = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
};

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const wait = limited(clientIp(req));
  if (wait > 0) return tooManyRequests(wait);

  // The same refusal of other sites as the /api proxy: a browser that names another origin is turned away.
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) {
    return new Response('Cross-site requests are not allowed', { status: 403 });
  }

  const { username } = await params;
  const asked = new URL(req.url).searchParams.get('lang');
  const lang = asked && isLocaleCode(asked) ? asked : null;
  const back = (outcome: string) => {
    const query = new URLSearchParams(lang ? { lang } : {});
    if (outcome === 'sent') query.set('sent', '1');
    else query.set('error', outcome);
    return NextResponse.redirect(
      new URL(`/${encodeURIComponent(username)}/contact?${query}`, SITE_URL),
      303,
    );
  };

  let data: FormData;
  try {
    data = await req.formData();
  } catch {
    return back('failed');
  }

  const headers = new Headers({ 'content-type': 'application/json' });
  if (PROXY_SECRET) {
    headers.set('x-proxy-secret', PROXY_SECRET);
    const ip = clientIp(req);
    if (ip !== 'unknown') headers.set('x-client-ip', ip);
  }

  try {
    const res = await fetch(`${API_URL}/public/${encodeURIComponent(username)}/contact`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        senderName: text(data, 'senderName'),
        senderEmail: text(data, 'senderEmail'),
        subject: text(data, 'subject'),
        message: text(data, 'message'),
        website: text(data, 'website'),
        formToken: text(data, 'formToken'),
        captcha: text(data, 'cf-turnstile-response'),
      }),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(55_000),
    });
    if (res.ok) return back('sent');
    const code = ((await res.json().catch(() => null)) as { error?: { code?: string } } | null)
      ?.error?.code;
    if (code === 'FORM_EXPIRED') return back('expired');
    if (code === 'CAPTCHA_FAILED') return back('captcha');
    if (res.status === 429) return back('busy');
    if (res.status === 400) return back('invalid');
    return back('failed');
  } catch {
    return back('failed');
  }
}
