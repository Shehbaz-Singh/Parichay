import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { isLocaleCode } from '@parichay/shared';
import {
  LinkCardView,
  linkCardMetadata,
  linkCardViewport,
} from '@/components/linkbio/link-card-pages';

type Props = { params: Promise<{ username: string; locale: string }> };

// The card in one of the profile's other languages. A code that is not a language, a language the
// owner has not added, and one whose translation is not ready are the same 404 (the API decides).
async function localeOf(params: Props['params']) {
  const { username, locale } = await params;
  if (!isLocaleCode(locale)) notFound();
  return { username, locale };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await localeOf(params);
  return linkCardMetadata(username, locale);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeOf(params);
  return linkCardViewport(username, locale);
}

export default async function LocaleLinksPage({ params }: Props) {
  const { username, locale } = await localeOf(params);
  return <LinkCardView username={username} locale={locale} />;
}
