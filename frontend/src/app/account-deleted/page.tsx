import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Footer } from '@/components/landing/Footer';
import { buttonStyles } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Account deleted',
  robots: { index: false },
};

// Where someone lands after deleting their account. Nothing on it needs a session.
export default function AccountDeletedPage() {
  return (
    <>
      <main id="main" className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
        <div
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent"
        >
          <Check className="size-6" />
        </div>
        <h1 className="type-page mt-6">Your account has been deleted</h1>
        <p className="mt-3 text-muted">
          Your account, your portfolio, your posts, your testimonials, your contact messages and
          your images have been erased, and your page address no longer works. You’ve been logged
          out.
        </p>
        <p className="mt-3 text-sm text-muted">
          Copies that search engines or other sites already made are outside our control, and our
          database provider may keep backups for a short while. The{' '}
          <Link href="/privacy#retention" className="font-medium text-accent-fg underline">
            Privacy Policy
          </Link>{' '}
          has the details.
        </p>
        <p className="mt-8 text-sm text-muted">
          Thank you for trying it. You’re always welcome back.
        </p>
        <Link href="/" className={`${buttonStyles({ variant: 'primary' })} mt-4`}>
          Back to the home page
        </Link>
      </main>
      <Footer />
    </>
  );
}
