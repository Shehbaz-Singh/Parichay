import type { Metadata } from 'next';
import Link from 'next/link';
import { ErrorPage } from '@/components/ErrorPage';
import { buttonStyles } from '@/components/ui';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

// Any address that matches nothing. (A missing portfolio has its own page in app/[username].)
export default function NotFound() {
  return (
    <ErrorPage
      eyebrow="404"
      title="Page not found"
      message="This page doesn’t exist. It may have moved, or the address may have a typo."
    >
      <Link href="/" className={buttonStyles({ variant: 'primary' })}>
        Back to home
      </Link>
      <Link href="/login" className={buttonStyles()}>
        Log in
      </Link>
    </ErrorPage>
  );
}
