import type { Metadata, Viewport } from 'next';
import { WorkView, workMetadata, pageViewport } from '@/components/portfolio/inner-pages';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return workMetadata((await params).username);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  return pageViewport((await params).username);
}

export default async function Page({ params }: Props) {
  return <WorkView username={(await params).username} />;
}
