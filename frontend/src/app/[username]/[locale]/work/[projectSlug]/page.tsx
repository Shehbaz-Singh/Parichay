import type { Metadata, Viewport } from 'next';
import { ProjectView, pageViewport, projectMetadata } from '@/components/portfolio/inner-pages';
import { localeParams } from '@/lib/route-locale';

type Props = { params: Promise<{ username: string; locale: string; projectSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale, projectSlug } = await localeParams(params);
  return projectMetadata(username, projectSlug, locale);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeParams(params);
  return pageViewport(username, locale);
}

export default async function LocaleProjectPage({ params }: Props) {
  const { username, locale, projectSlug } = await localeParams(params);
  return <ProjectView username={username} projectSlug={projectSlug} locale={locale} />;
}
