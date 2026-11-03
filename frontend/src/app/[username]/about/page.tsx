import type { Metadata, Viewport } from 'next';
import { AboutView, aboutMetadata, pageViewport } from '@/components/portfolio/inner-pages';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return aboutMetadata((await params).username);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  return pageViewport((await params).username);
}

export default async function Page({ params }: Props) {
  return <AboutView username={(await params).username} />;
}
