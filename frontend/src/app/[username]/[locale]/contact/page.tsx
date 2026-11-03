import type { Metadata, Viewport } from 'next';
import {
  ContactView,
  contactMetadata,
  pageViewport,
  type ContactQuery,
} from '@/components/portfolio/inner-pages';
import { localeParams } from '@/lib/route-locale';

// The Contact page in another language (see ../../contact/page.tsx).
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ username: string; locale: string }>;
  searchParams: Promise<ContactQuery>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ username, locale }, query] = await Promise.all([localeParams(params), searchParams]);
  return contactMetadata(username, locale, query);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeParams(params);
  return pageViewport(username, locale);
}

export default async function LocaleContactPage({ params, searchParams }: Props) {
  const [{ username, locale }, query] = await Promise.all([localeParams(params), searchParams]);
  return <ContactView username={username} locale={locale} query={query} />;
}
