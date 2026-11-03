'use client';

import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Check, CircleAlert, Copy, ExternalLink, LoaderCircle, QrCode } from 'lucide-react';
import { contactQrCard } from '@parichay/shared';
import { api } from '@/lib/client-api';
import { readFlag, writeFlag } from '@/lib/storage';
import { SITE_URL } from '@/lib/config';
import { ShareButton } from '../ShareButton';
import { Button, Modal, Switch, buttonStyles } from '../ui';
import { useEditor, type SaveStatus } from './editor-context';
import { useGo } from './navigation';
import { MobileMenu } from './Nav';
import { PublishCelebration } from './PublishCelebration';
import { useRegisterDashboardActions } from './palette/actions';
import { PaletteButton } from './palette/PaletteHost';
import { QrCodeDialog } from './QrCodeDialog';
import { ShareMessageButton } from './ShareMessage';
import { useCopy } from '@/lib/hooks';
import { NOTICES, PROBLEMS } from '@/lib/messages';

// The fields a portfolio is not much use without, and the Profile tab that fills each in.
const REQUIRED: {
  label: string;
  tab: string;
  isEmpty: (p: { fullName: string; about: string | null }) => boolean;
}[] = [
  { label: 'your name', tab: 'basics', isEmpty: (p) => !p.fullName.trim() },
  { label: 'an About section', tab: 'about', isEmpty: (p) => !p.about?.trim() },
];

const STATUS_TEXT: Record<SaveStatus | 'dirty', string> = {
  saved: 'All saved',
  pending: 'Saving in a moment…',
  dirty: 'Not saved yet',
  saving: 'Saving…',
  invalid: 'Check the highlighted fields and we’ll save',
  error: PROBLEMS.saveFailed,
};

// Whether what you see is safe on the server. Screen readers hear every state except "Saving…",
// which comes and goes too quickly to be worth announcing.
function SaveIndicator() {
  const { saveStatus, unsaved, retrySave } = useEditor();
  const key = saveStatus === 'saved' && unsaved ? 'dirty' : saveStatus;
  const text = STATUS_TEXT[key];
  const bad = key === 'error' || key === 'invalid';
  return (
    <div className="flex items-center gap-2 text-sm">
      <span aria-hidden="true" className={bad ? 'text-danger' : 'text-muted'}>
        {key === 'saved' ? (
          <Check className="size-4" />
        ) : key === 'saving' ? (
          <LoaderCircle className="size-4 motion-safe:animate-spin" />
        ) : bad ? (
          <CircleAlert className="size-4" />
        ) : (
          <span className="block size-2.5 rounded-full bg-warning-fg" />
        )}
      </span>
      <span aria-hidden="true" className={bad ? 'font-medium text-danger' : 'text-muted'}>
        {text}
      </span>
      <span role="status" className="sr-only">
        {key === 'saving' ? '' : text}
      </span>
      {key === 'error' && retrySave && (
        <Button size="sm" onClick={retrySave}>
          Retry
        </Button>
      )}
    </div>
  );
}

function PublishControls() {
  const { profile, update, notify, attempt } = useEditor();
  const go = useGo();
  const [pending, setPending] = useState(false);
  const [asking, setAsking] = useState(false);
  const { copied, copy: copyText } = useCopy();
  const [celebrating, setCelebrating] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const missing = REQUIRED.filter((field) => field.isEmpty(profile));
  const shareSubject = profile.tagline
    ? `${profile.fullName} - ${profile.tagline}`
    : profile.fullName;
  const url = `${SITE_URL}/${profile.slug}`; // the canonical address, not whatever host this tab is on

  async function setPublished(published: boolean) {
    setAsking(false);
    setPending(true);
    await attempt(async () => {
      const res = await api<{ published: boolean }>('/profile/me/publish', {
        method: 'POST',
        body: { published },
      });
      update((p) => ({ ...p, published: res.published }));
      // The first time it goes live is a moment worth marking; after that a quiet note will do.
      const celebratedKey = `celebrated:${profile.id}`;
      if (res.published && !readFlag(celebratedKey)) {
        writeFlag(celebratedKey);
        setCelebrating(true);
      } else {
        notify('success', res.published ? NOTICES.portfolioLive : NOTICES.portfolioHidden);
      }
    });
    setPending(false);
  }

  function onToggle() {
    if (profile.published) return void setPublished(false);
    // Ask, but let them go ahead: a half-empty page may be exactly what they want for now.
    if (missing.length > 0) return setAsking(true);
    void setPublished(true);
  }

  async function copy() {
    if (!(await copyText(url))) notify('error', PROBLEMS.copyLink);
  }

  // The command palette does these through the same code as the buttons here.
  useRegisterDashboardActions({
    togglePublish: onToggle,
    copyUrl: () => void copy(),
    openQr: () => setShowQr(true),
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          checked={profile.published}
          label="Published"
          disabled={pending}
          onClick={onToggle}
        />
        <span className="text-sm font-medium">{profile.published ? 'Published' : 'Draft'}</span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <code className="hidden min-w-0 truncate rounded-control bg-surface px-2 py-1 text-xs md:block">
          {url.replace(/^https?:\/\//, '')}
        </code>
        <Button size="sm" onClick={copy}>
          {copied ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          <span className="max-sm:sr-only">{copied ? 'Copied' : 'Copy link'}</span>
          <span className="sr-only md:hidden"> to {url.replace(/^https?:\/\//, '')}</span>
        </Button>
        <Button size="sm" onClick={() => setShowQr(true)}>
          <QrCode aria-hidden="true" className="size-4" />
          <span className="max-sm:sr-only">QR code</span>
        </Button>
        {profile.published && (
          <>
            <a
              href={`/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ size: 'sm' })}
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              <span className="max-sm:sr-only">Open</span>
              <span className="sr-only"> your portfolio in a new tab</span>
            </a>
            <span className="hidden items-center gap-2 lg:flex">
              <ShareButton
                url={url}
                title={`${profile.fullName}'s portfolio`}
                message={profile.shareMessage}
                subject={shareSubject}
                variant="outline"
              />
              <ShareMessageButton url={url} />
            </span>
          </>
        )}
      </div>

      <QrCodeDialog
        open={showQr}
        onClose={() => setShowQr(false)}
        url={url}
        slug={profile.slug}
        name={profile.fullName}
        published={profile.published}
        contactCard={
          profile.contactCardEnabled && profile.published ? contactQrCard(profile, url) : null
        }
      />

      <PublishCelebration
        open={celebrating}
        onClose={() => setCelebrating(false)}
        url={url}
        slug={profile.slug}
        name={profile.fullName}
        message={profile.shareMessage}
        subject={shareSubject}
      />

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title="Your page isn’t quite finished"
        description={`It’s still missing ${missing.map((field) => field.label).join(' and ')}. You can publish now and finish later, but visitors will see it as it is.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAsking(false);
                void go('/dashboard/profile', missing[0]?.tab);
              }}
            >
              Finish it first
            </Button>
            <Button variant="primary" onClick={() => void setPublished(true)}>
              Publish as it is
            </Button>
          </>
        }
      />
    </>
  );
}

// Sticks to the top of every dashboard page: whether your work is saved, and the publishing
// controls with the public link.
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-page/95 px-4 py-2.5 backdrop-blur">
      <MobileMenu />
      <p className="lg:hidden">
        <Logo />
      </p>
      <SaveIndicator />
      <div className="ms-auto flex flex-wrap items-center gap-x-5 gap-y-2">
        <PaletteButton />
        <PublishControls />
      </div>
    </header>
  );
}
