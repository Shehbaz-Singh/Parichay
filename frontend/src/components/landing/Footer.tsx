import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-5 py-10 text-sm text-muted sm:px-8">
        <div className="max-w-xs">
          <Logo variant="footer" />
          <p className="mt-2">Parichay: your introduction, done properly.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/privacy" className="hover:text-ink hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ink hover:underline">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy#contact" className="hover:text-ink hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-ink hover:underline">
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      {/* Everything this site keeps in your browser, so there is nothing to hide: one sign-in cookie
          (set only on login) and two "already seen it" notes. No tracking. Keep in sync with the
          Privacy Policy, section "Cookies, storage and analytics". */}
      <p className="mx-auto max-w-6xl px-5 pb-8 text-xs text-muted sm:px-8">
        In your browser we store one cookie to keep you signed in, and two small notes that remember
        you have seen the welcome tour and the first-publish message. No tracking or advertising.{' '}
        <Link href="/privacy#storage" className="underline hover:text-ink">
          Details
        </Link>
      </p>
    </footer>
  );
}
