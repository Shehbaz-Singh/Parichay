import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { MessagesStep } from '@/components/dashboard/steps/MessagesStep';

export const metadata: Metadata = { title: 'Messages' };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Messages"
        description="Read what visitors send from your page, and set up the contact form."
      />
      <MessagesStep />
    </>
  );
}
