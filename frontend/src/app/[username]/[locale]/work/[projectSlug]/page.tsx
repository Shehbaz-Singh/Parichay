import type { Metadata } from 'next';
import { ProjectView, projectMetadata } from '@/components/portfolio/inner-pages';
import { localeParams } from '@/lib/route-locale';

type Props = { params: Promise<{ username: string; locale: string; projectSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale, projectSlug } = await localeParams(params);
  return projectMetadata(username, projectSlug, locale);
}

export default async function LocaleProjectPage({ params }: Props) {
  const { username, locale, projectSlug } = await localeParams(params);
  return <ProjectView username={username} projectSlug={projectSlug} locale={locale} />;
}
