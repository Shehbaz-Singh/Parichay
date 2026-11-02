'use client';

import { useEditor } from './editor-context';
import { completeness } from './Completeness';
import { PageHeader } from './layout';

// The first word of a name, for a greeting. An empty name (it is optional at sign-up) has none.
export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? '';

function timeOfDay(hour: number) {
  if (hour < 5) return 'Hello';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// The Home page's heading: a greeting by name, and a line about where things stand. It is only drawn once
// the profile has loaded in the browser, so the hour is the person's own.
export function Greeting() {
  const { profile } = useEditor();
  const name = firstName(profile.fullName);
  const { percent } = completeness(profile);
  const greeting = timeOfDay(new Date().getHours());

  const status = profile.published
    ? 'Your page is live. Changes you make here show up on it right away.'
    : percent === 0
      ? "Let's build your page. It only takes a few minutes, and you can change anything later."
      : "Your page is still a draft, so only you can see it. Publish it whenever you're ready.";

  return <PageHeader title={name ? `${greeting}, ${name}` : greeting} description={status} />;
}
