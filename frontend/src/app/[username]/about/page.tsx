import type { Metadata } from 'next';
import { AboutView, aboutMetadata } from '@/components/portfolio/inner-pages';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return aboutMetadata((await params).username);
}

export default async function AboutPage({ params }: Props) {
  return <AboutView username={(await params).username} />;
}
