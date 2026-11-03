import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AppTestimonials } from '@/components/auth/AppTestimonials';
import { Card } from '@/components/ui';

const POINTS = [
  'Start from your resume or from scratch',
  'Six themes, with a live preview',
  'Publish and share one link',
];

// A split layout on wide screens (what you get on the left, the form on the right) and a single
// column on phones. The strip of quotes sits below both.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto min-h-screen max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <aside className="hidden flex-col justify-center rounded-card bg-accent-soft p-card-lg lg:flex">
          <Link href="/" aria-label="Parichay" className="inline-block">
            <Logo variant="hero" />
          </Link>
          <p className="type-page mt-10 text-balance">
            A portfolio page you can share with one link
          </p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <Check aria-hidden="true" className="size-5 shrink-0 text-accent-fg" />
                {point}
              </li>
            ))}
          </ul>
        </aside>

        <div className="mx-auto w-full max-w-md self-center">
          <Link
            href="/"
            aria-label="Parichay"
            className="mb-6 inline-flex items-center gap-2 text-muted hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            <Logo variant="auth" />
          </Link>
          <Card padding="lg" className="shadow-raised">
            {children}
          </Card>
        </div>
      </div>

      <div className="mt-16">
        <AppTestimonials />
      </div>
    </main>
  );
}
