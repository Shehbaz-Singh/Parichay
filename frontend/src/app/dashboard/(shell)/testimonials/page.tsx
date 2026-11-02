import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/layout';
import { TestimonialsStep } from '@/components/dashboard/steps/TestimonialsStep';

export const metadata: Metadata = { title: 'Testimonials' };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Quotes from people you have worked with. You approve each one before it shows."
      />
      <TestimonialsStep />
    </>
  );
}
