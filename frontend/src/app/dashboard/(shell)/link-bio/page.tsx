import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { LinkBioStep } from '@/components/dashboard/steps/LinkBioStep';

export const metadata: Metadata = { title: 'Link-in-bio' };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Link-in-bio"
        description="A single short link that opens a card with buttons you choose."
        back={{ href: '/dashboard/extras', label: 'Share & extras' }}
      />
      <LinkBioStep />
    </>
  );
}
