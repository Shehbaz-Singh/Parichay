import type { Metadata, Viewport } from 'next';
import {
  LinkCardView,
  linkCardMetadata,
  linkCardViewport,
} from '@/components/linkbio/link-card-pages';

type Props = { params: Promise<{ username: string }> };

// The link-in-bio card (/<username>/links), server-rendered in the profile's default language; the
// other languages are in ../[locale]/links. A page whose card is off, unpublished or missing is a 404.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return linkCardMetadata((await params).username);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  return linkCardViewport((await params).username);
}

export default async function LinksPage({ params }: Props) {
  return <LinkCardView username={(await params).username} />;
}
