import type { Metadata, Viewport } from 'next';
import { localeParams } from '@/lib/route-locale';
import {
  LinkCardView,
  linkCardMetadata,
  linkCardViewport,
} from '@/components/linkbio/link-card-pages';

type Props = { params: Promise<{ username: string; locale: string }> };

// The card in one of the profile's other languages.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await localeParams(params);
  return linkCardMetadata(username, locale);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeParams(params);
  return linkCardViewport(username, locale);
}

export default async function LocaleLinksPage({ params }: Props) {
  const { username, locale } = await localeParams(params);
  return <LinkCardView username={username} locale={locale} />;
}
