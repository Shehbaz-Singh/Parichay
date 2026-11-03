import type { Metadata, Viewport } from 'next';
import {
  CustomPageView,
  customPageMetadata,
  pageViewport,
} from '@/components/portfolio/inner-pages';
import { localeParams } from '@/lib/route-locale';

type Props = { params: Promise<{ username: string; locale: string; pageSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale, pageSlug } = await localeParams(params);
  return customPageMetadata(username, pageSlug, locale);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeParams(params);
  return pageViewport(username, locale);
}

export default async function LocaleCustomPage({ params }: Props) {
  const { username, locale, pageSlug } = await localeParams(params);
  return <CustomPageView username={username} slug={pageSlug} locale={locale} />;
}
