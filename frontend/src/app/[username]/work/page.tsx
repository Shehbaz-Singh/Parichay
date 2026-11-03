import type { Metadata } from 'next';
import { WorkView, workMetadata } from '@/components/portfolio/inner-pages';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return workMetadata((await params).username);
}

export default async function WorkPage({ params }: Props) {
  return <WorkView username={(await params).username} />;
}
