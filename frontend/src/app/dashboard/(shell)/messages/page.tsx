import type { Metadata } from 'next';
import { MessagesStep } from '@/components/dashboard/steps/MessagesStep';

export const metadata: Metadata = { title: 'Messages' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Messages</h1>
      <MessagesStep />
    </>
  );
}
