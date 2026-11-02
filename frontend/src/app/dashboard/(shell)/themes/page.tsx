import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { ThemesPage } from '@/components/dashboard/ThemesPage';

export const metadata: Metadata = { title: 'Themes' };

export default function Page() {
  return (
    <>
      <PageHeader title="Themes" description="Pick how your page looks." />
      <ThemesPage />
    </>
  );
}
