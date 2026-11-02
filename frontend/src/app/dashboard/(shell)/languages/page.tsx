import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { LanguagesStep } from '@/components/dashboard/steps/LanguagesStep';

export const metadata: Metadata = { title: 'Languages' };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Languages"
        description="Translate your page so visitors can read it in their own language."
      />
      <LanguagesStep />
    </>
  );
}
