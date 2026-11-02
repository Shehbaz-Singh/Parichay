'use client';

import { useId, useState } from 'react';
import { CONTACT_INTRO_MAX, type ContactSettings, type SectionConfig } from '@parichay/shared';
import { api } from '@/lib/client-api';
import { NOTICES } from '@/lib/messages';
import { Button, Card, Input, Switch } from '../../ui';
import { errorText, useEditor } from '../editor-context';

type Saved = Pick<ContactSettings, 'contactFormEnabled'> & { contactFormIntro: string | null };

// The contact form's settings: on or off, a line above it, and a plain statement of what happens to
// the messages. Turning it on also shows the Contact section on the page (the same as the switch in
// the Sections step), so the owner is not left wondering why nothing appears.
export function ContactFormCard({ retentionDays }: { retentionDays: number }) {
  const { profile, update, notify } = useEditor();
  const inputId = useId();
  const [intro, setIntro] = useState(profile.contactFormIntro ?? '');
  const [busy, setBusy] = useState<'switch' | 'intro' | 'section' | null>(null);
  const on = profile.contactFormEnabled;
  const sectionShown = profile.sectionConfig.find((s) => s.key === 'contact')?.visible ?? false;
  const dirty = intro.trim() !== (profile.contactFormIntro ?? '');

  async function save(enabled: boolean, text: string): Promise<Saved> {
    const saved = await api<Saved>('/profile/me/messages/settings', {
      method: 'PUT',
      body: { contactFormEnabled: enabled, contactFormIntro: text.trim() || null },
    });
    update((p) => ({
      ...p,
      contactFormEnabled: saved.contactFormEnabled,
      contactFormIntro: saved.contactFormIntro,
    }));
    return saved;
  }

  async function showSection() {
    const sections = profile.sectionConfig.map((section) =>
      section.key === 'contact' ? { ...section, visible: true } : section,
    );
    const saved = await api<{ sections: SectionConfig }>('/profile/me/sections', {
      method: 'PUT',
      body: { sections },
    });
    update((p) => ({ ...p, sectionConfig: saved.sections }));
  }

  async function toggle() {
    setBusy('switch');
    try {
      // The intro that is typed but not saved yet is kept as it is: only the switch changes.
      await save(!on, profile.contactFormIntro ?? '');
      notify('success', on ? NOTICES.contactFormOff : NOTICES.contactFormOn);
      if (!on && !sectionShown) {
        await showSection();
        notify('success', NOTICES.contactFormShown);
      }
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function saveIntro() {
    setBusy('intro');
    try {
      await save(on, intro);
      notify('success', NOTICES.contactIntroSaved);
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function show() {
    setBusy('section');
    try {
      await showSection();
      notify('success', NOTICES.contactFormShown);
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">Contact form</p>
          <p className="text-sm text-muted">
            Adds a “Send a message” button to the Contact section of your page. Your email address
            is never shown to visitors.
          </p>
        </div>
        <span className="text-sm text-muted">{on ? 'On' : 'Off'}</span>
        <Switch checked={on} label="Contact form" disabled={busy === 'switch'} onClick={toggle} />
      </div>

      {on && !sectionShown && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          The Contact section is hidden, so the form is not on your page yet.
          <Button disabled={busy === 'section'} onClick={show}>
            Show it on my page
          </Button>
        </p>
      )}
      {on && !profile.published && (
        <p className="rounded-control bg-surface px-3 py-2 text-sm text-muted">
          Publish your page for the form to work. Visitors can only write to you from a live page.
        </p>
      )}

      <div>
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
          Line above the form (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={inputId}
            value={intro}
            maxLength={CONTACT_INTRO_MAX}
            onChange={(e) => setIntro(e.target.value)}
            aria-describedby={`${inputId}-note`}
            className="min-w-0 flex-1"
          />
          <Button disabled={!dirty || busy === 'intro'} onClick={saveIntro}>
            Save line
          </Button>
        </div>
        <p id={`${inputId}-note`} className="mt-1 text-xs text-muted">
          {intro.length} of {CONTACT_INTRO_MAX} characters, plain text. Leave it empty for “Send{' '}
          {profile.fullName} a message.” You can translate it on the Languages page.
        </p>
      </div>

      <div role="note" className="space-y-2 rounded-control bg-surface px-3 py-2 text-sm">
        <p>
          <strong>No email is sent.</strong> You only see new messages when you open this dashboard.
          The number next to Messages in the menu, and in this tab’s title, updates about once a
          minute while it is open.
        </p>
        <p>
          Messages, with the sender’s name and email address, are kept for {retentionDays} days and
          then deleted automatically. You can delete any of them sooner, and they are included in
          the data export and deleted with your account. Visitors are told this under the form.
        </p>
      </div>
    </Card>
  );
}
