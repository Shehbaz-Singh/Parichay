import { projectCard } from '@/components/portfolio/project-card';

export const alt = 'Project preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
}) {
  const { username, projectSlug } = await params;
  return projectCard(username, projectSlug);
}
