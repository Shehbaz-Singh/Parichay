import type { Metadata } from 'next';
import { localeParams } from '@/lib/route-locale';
import { WritingListView, writingListMetadata } from '@/components/portfolio/writing-pages';

type Props = { params: Promise<{ username: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await localeParams(params);
  return writingListMetadata(username, locale);
}

export default async function LocaleWritingPage({ params }: Props) {
  const { username, locale } = await localeParams(params);
  return <WritingListView username={username} locale={locale} />;
}
