import type { Metadata } from 'next';
import { LinkBioStep } from '@/components/dashboard/steps/LinkBioStep';

export const metadata: Metadata = { title: 'Link-in-bio' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Link-in-bio</h1>
      <LinkBioStep />
    </>
  );
}
