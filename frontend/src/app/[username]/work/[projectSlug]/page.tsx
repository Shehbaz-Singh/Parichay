import type { Metadata } from 'next';
import { ProjectView, projectMetadata } from '@/components/portfolio/inner-pages';

type Props = { params: Promise<{ username: string; projectSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, projectSlug } = await params;
  return projectMetadata(username, projectSlug);
}

export default async function ProjectPage({ params }: Props) {
  const { username, projectSlug } = await params;
  return <ProjectView username={username} projectSlug={projectSlug} />;
}
