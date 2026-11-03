import { isLocaleCode } from '@parichay/shared';
import { projectCard } from '@/components/portfolio/project-card';

export const alt = 'Project preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; locale: string; projectSlug: string }>;
}) {
  const { username, locale, projectSlug } = await params;
  if (!isLocaleCode(locale)) return new Response('Not found', { status: 404 });
  return projectCard(username, projectSlug, locale);
}
