import type { Metadata } from 'next';
import Link from 'next/link';
import { ErrorPage } from '@/components/ErrorPage';
import { buttonStyles } from '@/components/ui';

export const metadata: Metadata = { title: 'Portfolio not found', robots: { index: false } };

// Shown for a missing slug and for an unpublished profile alike: visitors cannot tell the two
// apart, which is deliberate.
export default function ProfileNotFound() {
  return (
    <ErrorPage
      eyebrow="404"
      title="Portfolio not found"
      message="This page doesn’t exist, or its owner hasn’t published it yet."
    >
      <Link href="/" className={buttonStyles()}>
        Back to home
      </Link>
    </ErrorPage>
  );
}
