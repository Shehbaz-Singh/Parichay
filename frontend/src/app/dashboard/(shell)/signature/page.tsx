import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { SignatureGenerator } from '@/components/dashboard/SignatureGenerator';

export const metadata: Metadata = { title: 'Email signature' };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Email signature"
        description="Build a signature for your email app."
        back={{ href: '/dashboard/extras', label: 'Share & extras' }}
      />
      <SignatureGenerator />
    </>
  );
}
