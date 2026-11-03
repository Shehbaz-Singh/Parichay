import type { Metadata, Viewport } from 'next';
import {
  CustomPageView,
  customPageMetadata,
  pageViewport,
} from '@/components/portfolio/inner-pages';

type Props = { params: Promise<{ username: string; pageSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, pageSlug } = await params;
  return customPageMetadata(username, pageSlug);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  return pageViewport((await params).username);
}

export default async function CustomPage({ params }: Props) {
  const { username, pageSlug } = await params;
  return <CustomPageView username={username} slug={pageSlug} />;
}
