import type { Metadata, Viewport } from 'next';
import { AboutView, aboutMetadata, pageViewport } from '@/components/portfolio/inner-pages';
import { localeParams } from '@/lib/route-locale';

type Props = { params: Promise<{ username: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await localeParams(params);
  return aboutMetadata(username, locale);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeParams(params);
  return pageViewport(username, locale);
}

export default async function LocalePage({ params }: Props) {
  const { username, locale } = await localeParams(params);
  return <AboutView username={username} locale={locale} />;
}
