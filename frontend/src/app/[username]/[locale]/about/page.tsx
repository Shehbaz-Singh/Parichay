import type { Metadata } from 'next';
import { AboutView, aboutMetadata } from '@/components/portfolio/inner-pages';
import { localeParams } from '@/lib/route-locale';

type Props = { params: Promise<{ username: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await localeParams(params);
  return aboutMetadata(username, locale);
}

export default async function LocaleAboutPage({ params }: Props) {
  const { username, locale } = await localeParams(params);
  return <AboutView username={username} locale={locale} />;
}
