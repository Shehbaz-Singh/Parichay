import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { contactFormInfoSchema, isLocaleCode } from '@parichay/shared';
import { buildContactForm } from '@/components/themes/blocks';
import { ContactForm, type ContactStatus } from '@/components/themes/ContactForm';
import { LocaleScope } from '@/components/portfolio/LocaleScope';
import { WritingShell } from '@/components/writing/WritingShell';
import { getPublicProfile } from '@/lib/api';
import { API_URL, PROXY_SECRET } from '@/lib/config';
import { fill, uiFor } from '@/lib/i18n';

// The contact form on a page of its own: what the "Send a message" link opens without JavaScript, and
// where the form's own post comes back to. It is never cached, because the form carries a signed time
// stamp that must be fresh (the portfolio page itself is cached for a minute and more). It is not for
// search engines. A page whose form is switched off, unpublished, missing or a sample is a 404, like
// the API says.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ lang?: string; sent?: string; error?: string }>;
};

const langOf = (lang: string | undefined) => (lang && isLocaleCode(lang) ? lang : undefined);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const profile = await getPublicProfile(username, langOf(query.lang));
  if (!profile?.contactForm) notFound();
  return {
    title: {
      absolute: fill(uiFor(profile.locale).contactForm.pageTitle, { name: profile.fullName }),
    },
    robots: { index: false, follow: false },
  };
}

async function loadFormInfo(slug: string) {
  const headers = new Headers();
  if (PROXY_SECRET) headers.set('x-proxy-secret', PROXY_SECRET);
  const res = await fetch(`${API_URL}/public/${encodeURIComponent(slug)}/contact`, {
    cache: 'no-store',
    headers,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Contact form API responded with ${res.status}`);
  return contactFormInfoSchema.parse(await res.json());
}

const STATUSES: ContactStatus[] = ['invalid', 'expired', 'busy', 'captcha', 'failed'];

export default async function ContactPage({ params, searchParams }: Props) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const profile = await getPublicProfile(username, langOf(query.lang));
  if (!profile?.contactForm) notFound();
  const info = await loadFormInfo(profile.slug);
  if (!info) notFound();

  const ui = uiFor(profile.locale);
  const form = buildContactForm(
    profile,
    profile.contactForm.intro,
    profile.contactForm.retentionDays,
  );
  const status: ContactStatus | undefined =
    query.sent === '1' ? 'sent' : STATUSES.find((value) => value === query.error);

  return (
    <LocaleScope locale={profile.locale} links={[]} label={ui.switcher.label}>
      <WritingShell profile={profile} allPosts={false}>
        <h1 className="wr-display type-page">
          {fill(ui.contactForm.pageTitle, { name: profile.fullName })}
        </h1>
        <div className="mt-6">
          <ContactForm
            form={form}
            page={{ token: info.token, captchaKey: info.captcha?.siteKey ?? null, status }}
          />
        </div>
      </WritingShell>
    </LocaleScope>
  );
}
