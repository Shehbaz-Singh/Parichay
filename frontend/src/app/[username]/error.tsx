'use client';

import { ErrorPage } from '@/components/ErrorPage';
import { Button } from '@/components/ui';

// Shown when the profile cannot be loaded for any reason other than "not found", for example
// the API being down. Distinct from the 404 page so an outage never looks like a missing profile.
export default function ProfileError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPage
      title="Something went wrong"
      message="We couldn’t load this portfolio right now. If the site hasn’t been visited for a while, the server can take up to a minute to wake up, so please try again in a moment."
    >
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </ErrorPage>
  );
}
