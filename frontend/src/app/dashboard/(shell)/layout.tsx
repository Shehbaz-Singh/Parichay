import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false },
};

// Every dashboard page except the preview frame shares this: the sidebar, the top bar and the
// profile being edited stay in place while the page in the middle changes. The footer is passed in
// from here because it is a server component (it works out the year on the server).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell footer={<DashboardFooter />}>{children}</DashboardShell>;
}
