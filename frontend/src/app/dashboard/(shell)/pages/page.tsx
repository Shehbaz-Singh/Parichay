import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { PagesStep } from '@/components/dashboard/steps/PagesStep';

export const metadata: Metadata = { title: 'Pages' };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Pages"
        description="Keep your portfolio on one page, or give your work, story and more their own pages."
      />
      <PagesStep />
    </>
  );
}
