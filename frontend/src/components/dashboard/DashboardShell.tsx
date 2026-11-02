'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { MyProfile } from '@parichay/shared';
import { api } from '@/lib/client-api';
import { useLoad, useMediaQuery } from '@/lib/hooks';
import { Button, ConfirmProvider, Sheet } from '../ui';
import { cx } from '../ui/cx';
import { EditorProvider } from './editor-context';
import { MessagesProvider } from './messages-context';
import { Sidebar } from './Nav';
import { DashboardActionsProvider } from './palette/actions';
import { PaletteProvider } from './palette/PaletteHost';
import { Preview } from './Preview';
import { Onboarding } from './Onboarding';
import { LoadFailed, Loading } from './screens';
import { ImportBanner } from './steps/ImportStep';
import { TopBar } from './TopBar';

const loadProfile = (signal: AbortSignal) => api<MyProfile>('/profile/me', { signal });

// The form, and the live preview beside it on a wide screen (it can be hidden to give the form the
// whole width). Below 1280 px there is no room for both, so the preview opens as a panel from a
// button instead. The form is never unmounted, so nothing typed is lost by looking at the preview.
function Workspace({ children }: { children: ReactNode }) {
  const wide = useMediaQuery('(min-width: 1280px)');
  const [shown, setShown] = useState(true); // the side-by-side preview, on a wide screen
  const [open, setOpen] = useState(false); // the slide-over, on a narrower one
  const sideBySide = wide && shown;

  return (
    <div className="p-4">
      {/* minmax(0, 1fr): a column may shrink below its content, or the preview (whose size follows
          the column) would hold the column open and spill off a narrow screen. */}
      <div
        className={cx(
          'grid grid-cols-[minmax(0,1fr)] gap-6',
          sideBySide && 'xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]',
        )}
      >
        <div className={cx('min-w-0', !sideBySide && 'mx-auto w-full max-w-4xl')}>
          {wide && (
            <div className="mb-4 flex justify-end">
              <Button size="sm" aria-pressed={shown} onClick={() => setShown(!shown)}>
                {shown ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
                {shown ? 'Hide preview' : 'Show preview'}
              </Button>
            </div>
          )}
          {children}
        </div>
        {sideBySide && (
          <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
            <Preview />
          </div>
        )}
      </div>
      {!wide && (
        <>
          <Button
            variant="primary"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="fixed end-4 bottom-4 z-20 shadow-overlay"
          >
            <Eye aria-hidden="true" className="size-4" />
            See your page
          </Button>
          <Sheet
            open={open}
            onClose={() => setOpen(false)}
            title="Your page"
            description="How visitors see it, as you type."
            width="xl"
          >
            <Preview />
          </Sheet>
        </>
      )}
    </div>
  );
}

// Pages that have no portfolio to preview: Home, Share & extras and its sub-pages, the inbox,
// and account settings. (The link-in-bio page draws its own preview.)
const NO_PREVIEW = [
  '/dashboard',
  '/dashboard/extras',
  '/dashboard/settings',
  '/dashboard/signature',
  '/dashboard/messages',
  '/dashboard/link-bio',
];

function Frame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const withPreview = !NO_PREVIEW.includes(pathname);
  return (
    <div className="dashboard-root min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopBar />
        <Onboarding />
        <main id="main">
          <ImportBanner />
          {withPreview ? (
            <Workspace>{children}</Workspace>
          ) : (
            <div className="mx-auto w-full max-w-4xl p-4">{children}</div>
          )}
        </main>
      </div>
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
