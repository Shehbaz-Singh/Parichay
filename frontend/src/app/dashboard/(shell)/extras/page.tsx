import type { Metadata } from 'next';
import { ExtrasPage } from '@/components/dashboard/ExtrasPage';

export const metadata: Metadata = { title: 'Share & extras' };

export default function Page() {
  return <ExtrasPage />;
}
