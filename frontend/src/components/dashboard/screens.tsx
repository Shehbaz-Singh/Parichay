'use client';

import type { ReactNode } from 'react';
import { ApiError } from '@/lib/client-api';
import { useSlow } from '@/lib/hooks';
import { Button, Skeleton } from '../ui';

// Waiting and failure states shared by the dashboard shell and the account settings.

// What is said next to the placeholders: the label, and after a few seconds why it is slow (the free
// server sleeps when nobody has used it for a while).
function WaitMessage({ label }: { label: string }) {
  const slow = useSlow(true);
  return (
    <div className="space-y-1">
      <p role="status" className="text-sm font-medium">
        {slow ? 'Still waking things up…' : label}
      </p>
      {slow && (
        <p className="max-w-sm text-sm text-muted">
          Our server takes a nap when nobody has used it for a while. The first visit can take up to
          a minute, and after that it’s quick. Thanks for waiting.
        </p>
      )}
    </div>
  );
}

// Grey shapes where the content will be, for a page that is still loading.
export function ContentSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6">
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <WaitMessage label={label} />
    </div>
  );
}

// The whole dashboard (sidebar, top bar, form, preview) as placeholders, before the profile is here.
export function Loading({ label }: { label: string }) {
  return (
    <div className="flex-1 lg:flex">
      <div
        aria-hidden="true"
        className="hidden w-60 shrink-0 space-y-3 border-e border-line p-4 lg:block"
      >
        <Skeleton className="h-6 w-40" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
      <main id="main" className="min-w-0 flex-1">
        <div aria-hidden="true" className="flex gap-4 border-b border-line px-4 py-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="ms-auto h-7 w-56" />
        </div>
        <div className="grid gap-6 p-4 xl:grid-cols-2">
          <ContentSkeleton label={label} />
          <Skeleton className="hidden h-96 xl:block" />
        </div>
      </main>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
    </div>
  );
}

export function LoadFailed({
  title,
  error,
  retry,
  page,
}: {
  title: string;
  error: unknown;
  retry: () => void;
  page?: boolean; // the whole screen (no dashboard around it), so it is the page's main region
}) {
  const body = (
    <Centered>
      <h1 className="type-page">{title}</h1>
      <div className="max-w-sm text-muted">
        <p>{error instanceof ApiError ? error.message : 'Something went wrong on our side.'}</p>
        <p>Nothing you’ve saved is lost. Give it another try in a moment.</p>
      </div>
      <Button variant="primary" onClick={retry}>
        Try again
      </Button>
    </Centered>
  );
  return page ? (
    <main id="main" className="flex flex-1 flex-col justify-center">
      {body}
    </main>
  ) : (
    body
  );
}
