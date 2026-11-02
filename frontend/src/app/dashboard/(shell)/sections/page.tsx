import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { SectionsStep } from '@/components/dashboard/steps/SectionsStep';

export const metadata: Metadata = { title: 'Sections' };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Sections"
        description="Choose which sections show on your page, rename them and set their order."
      />
      <SectionsStep />
    </>
  );
}
