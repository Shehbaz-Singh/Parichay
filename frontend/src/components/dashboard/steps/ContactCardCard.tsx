'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { contactCardInput, hiddenContactLinks } from '@parichay/shared';
import { SITE_URL } from '@/lib/config';
import { fill, uiFor } from '@/lib/i18n';
import { useCopy } from '@/lib/hooks';
import { PROBLEMS } from '@/lib/messages';
import { Switch, buttonStyles } from '../../ui';
import { useEditor } from '../editor-context';

const PHOTO_FIELD = 'Photo (a small square copy, about 200 px)';

// "Let visitors save my contact card": a vCard on the public page's "Add to contacts" button. The
// preview below is worked out by the same function as the file (shared/src/contact-card.ts), so it
// lists exactly what is in it, and says what is left out and why.
export function ContactCardCard() {
  const { profile, saveFields, notify, attempt } = useEditor();
  const [saving, setSaving] = useState<'enabled' | 'photo' | null>(null);
  const { copied, copy: copyText } = useCopy();
  const on = profile.contactCardEnabled;
  const photoOn = profile.contactCardPhoto;
  const hasPhoto = Boolean(profile.avatarUrl);
  const path = `/${profile.slug}/contact.vcf`;
  const fileUrl = `${SITE_URL}${path}`;
  const portfolioUrl = `${SITE_URL}/${profile.slug}`;

  async function change(
    field: 'enabled' | 'photo',
    changes: { contactCardEnabled?: boolean; contactCardPhoto?: boolean },
  ) {
    setSaving(field);
    await attempt(() => saveFields(changes));
    setSaving(null);
  }

  async function copy() {
    if (!(await copyText(fileUrl))) notify('error', PROBLEMS.copyLink);
  }

  // What the file holds, from the same mapping the file uses (a stand-in marks where the photo goes).
  const card = contactCardInput(profile, {
    portfolioUrl,
    note: fill(uiFor(profile.defaultLocale).contact.note, { url: portfolioUrl }),
    photoJpegBase64: photoOn && hasPhoto ? 'x' : null,
  });
  const rows: { field: string; value: string }[] = [
    { field: 'Name', value: card.fullName },
    ...(card.title ? [{ field: 'Title (your tagline)', value: card.title }] : []),
    { field: 'Website (your portfolio)', value: card.url },
    ...(card.emails ?? []).map((value) => ({ field: 'Email', value })),
    ...(card.phones ?? []).map((value) => ({ field: 'Phone', value })),
    ...(card.links ?? []).map((link) => ({ field: link.label, value: link.url })),
    ...(card.location ? [{ field: 'Place', value: card.location }] : []),
    ...(card.photoJpegBase64 ? [{ field: PHOTO_FIELD, value: 'Your profile photo' }] : []),
    { field: 'Note', value: card.note ?? '' },
  ];
  const hidden = hiddenContactLinks(profile);

  return (
    <div className="space-y-4 rounded-card border border-line p-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Let visitors save my contact card</p>
          <p className="text-xs text-muted">
            Adds an “Add to contacts” button to your page. It downloads a contact card (.vcf) that
            phones and email apps can save. Only available while your page is published.
          </p>
        </div>
        <Switch
          checked={on}
          label="Let visitors save my contact card"
          disabled={saving !== null || (!profile.published && !on)}
          onClick={() => change('enabled', { contactCardEnabled: !on })}
        />
      </div>

      {!profile.published && (
        <p className="rounded-control bg-surface px-3 py-2 text-sm text-muted">
          Publish your page to switch this on. Visitors can only get the card from a live page.
        </p>
      )}

      {on && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Include my photo</p>
              <p className="text-xs text-muted">
                {hasPhoto
                  ? 'Adds a small square copy of your profile photo to the card. Off by default.'
                  : 'Add a profile photo under Details first.'}
              </p>
            </div>
            <Switch
              checked={photoOn && hasPhoto}
              label="Include my photo in the contact card"
              disabled={saving !== null || !hasPhoto}
              onClick={() => change('photo', { contactCardPhoto: !photoOn })}
            />
          </div>

          <div
            role="note"
            className="rounded-control bg-warning-bg px-3 py-2 text-sm text-warning-fg"
          >
            Anyone who visits your page can save everything listed below to their contacts, so check
            this list. To change what is in it, change which links you show under Links.
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">What is in the card</h3>
            <dl className="divide-y divide-line rounded-control border border-line text-sm">
              {rows.map((row, i) => (
                <div
                  key={`${row.field}-${i}`}
                  className="grid gap-x-4 px-3 py-2 sm:grid-cols-[11rem_1fr]"
                >
                  <dt className="text-muted">{row.field}</dt>
                  <dd className="min-w-0 break-words">{row.value}</dd>
                </div>
              ))}
              {hidden.map((link, i) => (
                <div
                  key={`hidden-${i}`}
                  className="grid gap-x-4 px-3 py-2 sm:grid-cols-[11rem_1fr]"
                >
                  <dt className="text-muted">{link.label}</dt>
                  <dd className="text-muted italic">
                    Hidden on your page, so it is not in the card.
                  </dd>
                </div>
              ))}
              {!(photoOn && hasPhoto) && (
                <div className="grid gap-x-4 px-3 py-2 sm:grid-cols-[11rem_1fr]">
                  <dt className="text-muted">Photo</dt>
                  <dd className="text-muted italic">
                    {hasPhoto
                      ? 'Not included (switch “Include my photo” on to add it).'
                      : 'You have no photo.'}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {profile.published && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <a href={path} download className={buttonStyles({ variant: 'secondary' })}>
                  <Download aria-hidden="true" className="size-4" />
                  Download my card
                </a>
                <button
                  type="button"
                  onClick={copy}
                  className={buttonStyles({ variant: 'secondary' })}
                >
                  {copied ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Copy aria-hidden="true" className="size-4" />
                  )}
                  {copied ? 'Copied' : 'Copy file link'}
                </button>
              </div>
              <p className="text-xs break-all text-muted">
                <span className="sr-only">File address: </span>
                <code>{fileUrl}</code>
              </p>
              <p className="text-xs text-muted">
                A change can take about a minute to reach the file visitors get.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
