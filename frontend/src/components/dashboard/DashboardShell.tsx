'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Eye, Pencil } from 'lucide-react';
import type { MyProfile } from '@parichay/shared';
import { api } from '@/lib/client-api';
import { useLoad, useMediaQuery } from '@/lib/hooks';
import { ConfirmProvider } from '../ui';
import { cx } from '../ui/cx';
import { EditorProvider } from './editor-context';
import { MessagesProvider } from './messages-context';
import { BottomNav, Sidebar } from './Nav';
import { DashboardActionsProvider } from './palette/actions';
import { PaletteProvider } from './palette/PaletteHost';
import { Preview } from './Preview';
import { Onboarding } from './Onboarding';
import { LoadFailed, Loading } from './screens';
import { ImportBanner } from './steps/ImportStep';
import { TopBar } from './TopBar';

const loadProfile = (signal: AbortSignal) => api<MyProfile>('/profile/me', { signal });

// The form on the left and the live preview on the right. Below 1280 px they do not fit side by
// side, so one is shown at a time and a switch changes which. The form stays mounted while hidden,
// so nothing typed is lost by looking at the preview.
function Workspace({ children }: { children: ReactNode }) {
  const wide = useMediaQuery('(min-width: 1280px)');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const showForm = wide || mode === 'edit';
  const showPreview = wide || mode === 'preview';

  return (
    <div className="p-4">
      {!wide && (
        <div
          role="group"
          aria-label="Show"
          className="mb-4 inline-flex rounded-control border border-line p-0.5"
        >
          {(
            [
              ['edit', 'Edit', Pencil],
              ['preview', 'See your page', Eye],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-control px-4 py-1.5 text-sm font-medium',
                mode === id ? 'bg-accent text-on-accent' : 'hover:bg-surface active:bg-line',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </button>
          ))}
        </div>
      )}
      {/* minmax(0, 1fr): a column may shrink below its content, or the preview (whose size follows
          the column) would hold the column open and spill off a narrow screen. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className={cx('min-w-0', !showForm && 'hidden')}>{children}</div>
        {showPreview && (
          <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
            <Preview />
          </div>
        )}
      </div>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  // Account settings, the email signature, the inbox and the link-in-bio card have no portfolio to
  // preview (the card page draws its own preview).
  const pathname = usePathname();
  const withPreview = ![
    '/dashboard/settings',
    '/dashboard/signature',
    '/dashboard/messages',
    '/dashboard/link-bio',
  ].includes(pathname);
  return (
    <div className="dashboard-root min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <TopBar />
        <Onboarding />
        <main id="main">
          <ImportBanner />
          {withPreview ? <Workspace>{children}</Workspace> : <div className="p-4">{children}</div>}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

// Loads the profile in the browser, through the /api proxy, so a sleeping free-tier API shows a
// waiting screen with a retry instead of a blank page that is still loading on the server. The
// route guard (src/proxy.ts) keeps signed-out users out.
export function DashboardShell({ children }: { children: ReactNode }) {
  const { state, retry } = useLoad(loadProfile);

  if (state.status === 'loading') return <Loading label="Getting your page ready…" />;
  if (state.status === 'error') {
    return (
      <LoadFailed page title="We couldn’t open your dashboard" error={state.error} retry={retry} />
    );
  }
  return (
    <EditorProvider initial={state.data}>
      <ConfirmProvider>
        <DashboardActionsProvider>
          <MessagesProvider>
            <PaletteProvider>
              <Frame>{children}</Frame>
            </PaletteProvider>
          </MessagesProvider>
        </DashboardActionsProvider>
      </ConfirmProvider>
    </EditorProvider>
  );
}
