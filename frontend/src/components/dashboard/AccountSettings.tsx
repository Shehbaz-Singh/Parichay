'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  DELETE_CONFIRMATION,
  changePasswordSchema,
  deleteAccountSchema,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type SessionResponse,
  ERROR_CODES,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { useLoad } from '@/lib/hooks';
import { Form, TextField } from '../form-fields';
import { downloadMyData } from '@/lib/download-export';
import { Button, Card } from '../ui';
import { PageHeader } from './layout';
import { LogOutButton } from './Nav';
import { ContentSkeleton, LoadFailed } from './screens';
import { PROBLEMS } from '@/lib/messages';

const loadSession = (signal: AbortSignal) => api<SessionResponse>('/auth/me', { signal });

type PasswordFields = { currentPassword: string; newPassword: string; confirmPassword: string };

function ChangePassword() {
  const [changed, setChanged] = useState(false);
  const form = useForm<PasswordFields, unknown, ChangePasswordInput>({
    resolver: schemaResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setChanged(false);
    if (values.newPassword !== form.getValues('confirmPassword')) {
      form.setError('confirmPassword', {
        message: PROBLEMS.passwordsDiffer,
      });
      return;
    }
    await api('/auth/change-password', {
      method: 'POST',
      body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
    });
    form.reset();
    setChanged(true);
  }

  return (
    <section aria-labelledby="password-heading" className="space-y-4">
      <h2 id="password-heading" className="type-section">
        Change password
      </h2>
      <Form
        form={form}
        onSubmit={onSubmit}
        codeFields={{ [ERROR_CODES.INVALID_PASSWORD]: 'currentPassword' }}
        submitLabel="Change password"
      >
        <TextField
          name="currentPassword"
          label="Current password"
          required
          type="password"
          autoComplete="current-password"
        />
        <TextField
          name="newPassword"
          label="New password"
          required
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters. A short phrase you’ll remember works well."
        />
        <TextField
          name="confirmPassword"
          label="Repeat new password"
          required
          type="password"
          autoComplete="new-password"
        />
      </Form>
      <p role="status" className="text-sm font-medium text-green-700">
        {changed ? 'All set. Your password has been changed.' : ''}
      </p>
      <p className="text-xs text-muted">
        If you’re logged in on other devices, they’ll stay logged in until their session runs out.
      </p>
    </section>
  );
}

// What is stored, what is public, and the way to take a copy. The policy has the full picture.
function YourData() {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'failed'>('idle');

  async function download() {
    setState('working');
    try {
      await downloadMyData();
      setState('done');
    } catch {
      setState('failed');
    }
  }

  return (
    <section aria-labelledby="data-heading" className="space-y-4">
      <h2 id="data-heading" className="type-section">
        Your data
      </h2>
      <div className="space-y-2 text-sm text-muted">
        <p>
          We keep your email, your portfolio content and your photo, and nothing more. We don’t
          track your visitors. A resume you upload for import is read and not stored.
        </p>
        <p>
          Your page is private until you publish it. Once it’s live, the parts you haven’t hidden
          are public. You can download a copy of everything we hold, or delete it all, here. The{' '}
          <Link href="/privacy" className="font-medium text-accent-fg underline">
            Privacy Policy
          </Link>{' '}
          has the details.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={download} disabled={state === 'working'}>
          <Download aria-hidden="true" className="size-4" />
          {state === 'working' ? 'Preparing…' : 'Download my data'}
        </Button>
        <p role="status" className="text-sm">
          {state === 'done' && (
            <span className="font-medium text-green-700">Your file has been downloaded.</span>
          )}
          {state === 'failed' && (
            <span className="font-medium text-danger">
              We couldn’t prepare your file. Please try again in a moment.
            </span>
          )}
        </p>
      </div>
      <p className="text-xs text-muted">
        A JSON file with your account email, profile, every section, custom sections, posts,
        testimonials, contact messages and settings. Your password is never included.
      </p>
    </section>
  );
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  const form = useForm<{ password: string; confirmation: string }, unknown, DeleteAccountInput>({
    resolver: schemaResolver(deleteAccountSchema),
    defaultValues: { password: '', confirmation: '' },
  });

  // Opening the confirmation moves the keyboard into it; cancelling brings it back to the button.
  useEffect(() => {
    if (confirming) panel.current?.querySelector('input')?.focus();
    else if (wasConfirming.current) openButton.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  async function onSubmit(values: DeleteAccountInput) {
    await api('/auth/me', { method: 'DELETE', body: values });
    window.location.assign('/account-deleted'); // the session is gone; say so on a page of its own
  }

  return (
    <Card as="section" tone="danger" aria-labelledby="delete-heading" className="space-y-4">
      <h2 id="delete-heading" className="type-section text-danger">
        Delete account and data
      </h2>
      <p className="text-sm text-ink">
        This permanently deletes your account, your portfolio, your posts, your testimonials, your
        contact messages and your images. Your page address stops working right away. It cannot be
        undone, so download your data first if you want a copy.
      </p>
      {confirming ? (
        <Card ref={panel} tone="danger-soft" className="space-y-4">
          <p className="text-sm font-medium">
            To confirm, enter your password and type {DELETE_CONFIRMATION}.
          </p>
          <Form
            form={form}
            onSubmit={onSubmit}
            codeFields={{ [ERROR_CODES.INVALID_PASSWORD]: 'password' }}
            submitLabel="Yes, delete everything"
            pendingLabel="Deleting…"
            danger
            onCancel={() => {
              setConfirming(false);
              form.reset();
            }}
          >
            <TextField
              name="password"
              label="Password"
              required
              type="password"
              autoComplete="current-password"
            />
            <TextField
              name="confirmation"
              label={`Type ${DELETE_CONFIRMATION} to confirm`}
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={DELETE_CONFIRMATION}
            />
          </Form>
        </Card>
      ) : (
        <Button ref={openButton} variant="danger" onClick={() => setConfirming(true)}>
          Delete my account and data
        </Button>
      )}
    </Card>
  );
}

export function AccountSettings() {
  const { state, retry } = useLoad(loadSession);

  if (state.status === 'loading') return <ContentSkeleton label="Getting your account…" />;
  if (state.status === 'error') {
    return (
      <LoadFailed
        title="We couldn’t open your account settings"
        error={state.error}
        retry={retry}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-10 py-4">
      <PageHeader
        title="Settings"
        description={
          <>
            Signed in as <span className="font-medium">{state.data.user.email}</span>
          </>
        }
      />
      <YourData />
      <ChangePassword />
      <section aria-labelledby="session-heading" className="space-y-3">
        <h2 id="session-heading" className="type-section">
          Log out
        </h2>
        <LogOutButton className="border border-line" />
      </section>
      <DeleteAccount />
    </div>
  );
}
