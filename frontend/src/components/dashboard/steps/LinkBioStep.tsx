'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Check, Copy, ExternalLink, Link2, QrCode } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  LINK_BIO_LABEL_MAX,
  LINK_BIO_MAX_BUTTONS,
  LINK_BIO_URL_MAX,
  linkBioButtonInputSchema,
  linkCardFeatures,
  type LinkBioButtonInput,
  type LinkBioSettings,
  type LinkBioStyle,
  type MyLinkBioButton,
} from '@parichay/shared';
import { SITE_URL } from '@/lib/config';
import { schemaResolver } from '@/lib/form';
import { buildLinkCard, linkCardFromEditor } from '@/lib/link-card';
import { NOTICES, PROBLEMS } from '@/lib/messages';
import { useCopy } from '@/lib/hooks';
import { TextField } from '../../form-fields';
import { LinkCard } from '../../linkbio/LinkCard';
import { Button, Card, Switch, buttonStyles } from '../../ui';
import { EditorForm } from '../EditorForm';
import { InfoToggle } from '../layout';
import { QrCodeDialog } from '../QrCodeDialog';
import { ListManager, type FormProps } from '../SectionManager';
import { useEditor, useLinkBio } from '../editor-context';

type Fields = { label: string; url: string };

// ---- the add and edit form of one custom button

function ButtonForm({ item, onDone, onSaved }: FormProps<MyLinkBioButton>) {
  const { create, updateItem } = useLinkBio();
  const { notify } = useEditor();
  const form = useForm<Fields, unknown, LinkBioButtonInput>({
    resolver: schemaResolver(linkBioButtonInputSchema),
    defaultValues: { label: item?.label ?? '', url: item?.url ?? '' },
  });

  async function onSubmit(values: LinkBioButtonInput) {
    await (item ? updateItem(item.id, values) : create(values));
    notify('success', item ? NOTICES.linkBioButtonSaved : NOTICES.linkBioButtonAdded);
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm
      form={form}
      onSubmit={onSubmit}
      submitLabel={item ? 'Save button' : 'Add button'}
      onCancel={onDone}
    >
      <TextField
        name="label"
        label="Button text"
        placeholder="e.g. Book a call"
        maxLength={LINK_BIO_LABEL_MAX}
        hint="What visitors read on the button."
        required
      />
      <TextField
        name="url"
        label="Link"
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={LINK_BIO_URL_MAX}
        hint="Must start with https:// or http://. Other kinds of link are not accepted."
        required
      />
    </EditorForm>
  );
}

// ---- one optional button's switch

function OptionalButton({
  label,
  hint,
  unavailable,
  checked,
  onChange,
  busy,
}: {
  label: string;
  hint: string;
  unavailable?: string; // why it cannot appear right now: the feature behind it is off
  checked: boolean;
  onChange: () => void;
  busy: boolean;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{unavailable ?? hint}</p>
      </div>
      <Switch
        checked={checked && !unavailable}
        label={`Show “${label}” on the card`}
        disabled={busy || Boolean(unavailable)}
        onClick={onChange}
      />
    </li>
  );
}

// ---- the phone

// The card in a frame the width of a phone, drawn by the same component as the public page. It is not
// clickable (the preview is for looking), and it keeps drawing from the saved and the unsaved values
// as they change, so there is nothing to refresh.
function PhonePreview({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Preview of your card" className="space-y-2">
      <div className="mx-auto w-full max-w-[390px] rounded-[2.25rem] border-[10px] border-ink bg-ink shadow-lg">
        <div className="h-[640px] overflow-y-auto rounded-[1.6rem] bg-page" inert>
          {children}
        </div>
      </div>
      <p className="text-center text-xs text-muted">
        Preview at phone width. It updates as you change things.
      </p>
    </section>
  );
}

// ---- the step

export function LinkBioStep() {
  const link = useLinkBio();
  const { profile, preview, notify, attempt } = useEditor();
  const [busy, setBusy] = useState<string | null>(null);
  const { copied, copy: copyText } = useCopy();
  const [showQr, setShowQr] = useState(false);

  const on = profile.linkBioEnabled;
  const url = `${SITE_URL}/${profile.slug}/links`;
  const shown = url.replace(/^https?:\/\//, '');
  const canEnable = profile.published || on;

  const features = linkCardFeatures({
    ...profile,
    timezone: profile.timezone,
    visibleLinks: profile.links.filter((l) => l.visible).length,
  });

  const model = useMemo(
    () => buildLinkCard(linkCardFromEditor(profile, preview)),
    [profile, preview],
  );

  async function change(key: string, changes: Partial<LinkBioSettings>, success?: string) {
    setBusy(key);
    await attempt(() => link.saveSettings(changes), success);
    setBusy(null);
  }

  async function copy() {
    const ok = await copyText(url);
    notify(ok ? 'success' : 'error', ok ? NOTICES.linkBioCopied : PROBLEMS.linkBioCopy);
  }

  const optional: {
    key: keyof LinkBioSettings;
    label: string;
    hint: string;
    unavailable?: string;
  }[] = [
    {
      key: 'linkBioShowContact',
      label: 'Contact me',
      hint: 'Opens your contact form right on the card.',
      unavailable:
        profile.contactFormEnabled && !profile.isSample
          ? undefined
          : 'Switch on the contact form under Messages first.',
    },
    {
      key: 'linkBioShowVcard',
      label: 'Add to contacts',
      hint: 'Downloads your contact card (.vcf).',
      unavailable:
        profile.contactCardEnabled && !profile.isSample
          ? profile.links.some((l) => l.visible)
            ? undefined
            : 'Show at least one link on your page first. The card is made from them.'
          : 'Switch on “Let visitors save my contact card” under Share & extras first.',
    },
    {
      key: 'linkBioShowResume',
      label: 'Download resume',
      hint: 'Your resume as a PDF, made from your page.',
      unavailable: profile.resumeEnabled
        ? undefined
        : 'Switch on the resume download under Share & extras first.',
    },
    {
      key: 'linkBioShowShare',
      label: 'Share button',
      hint: 'Shares your portfolio with your suggested message.',
    },
    {
      key: 'linkBioShowWork',
      label: 'Working-together line',
      hint: 'Your local time and whether you are within working hours.',
      unavailable:
        profile.workCardEnabled && profile.timezone
          ? undefined
          : 'Switch on the Working together card, with a time zone, under Share & extras first.',
    },
  ];
  // Which of them the card really shows, for the summary under the switches.
  const active = [features.contact, features.vcard, features.resume, features.share, features.work];

  return (
    <section aria-label="Link-in-bio card" className="space-y-6">
      <InfoToggle label="What is a link-in-bio card?">
        A short, mobile-first version of your page for places that allow one link: your Instagram
        bio, a WhatsApp status, an email signature. It lists your own buttons, your links and the
        features you have switched on.
      </InfoToggle>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,390px)]">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Link-in-bio card</p>
                <p className="text-sm text-muted">
                  Anyone with the link can open it. Search engines are told to leave it out, and
                  point to your full portfolio instead.
                </p>
              </div>
              <span className="text-sm text-muted">{on ? 'On' : 'Off'}</span>
              <Switch
                checked={on}
                label="Link-in-bio card"
                disabled={busy === 'enabled' || !canEnable}
                onClick={() =>
                  change(
                    'enabled',
                    { linkBioEnabled: !on },
                    on ? NOTICES.linkBioOff : NOTICES.linkBioOn,
                  )
                }
              />
            </div>
            {!canEnable && (
              <p className="rounded-control bg-surface px-3 py-2 text-sm text-muted">
                Publish your page to switch this on. The card’s link only works for a live page.
              </p>
            )}

            <div className="space-y-2 border-t border-line pt-4">
              <p className="text-sm font-medium">Your link</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 rounded-control bg-surface px-3 py-2 text-sm break-all">
                  {shown}
                </code>
                <Button onClick={copy} disabled={!on}>
                  {copied ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Copy aria-hidden="true" className="size-4" />
                  )}
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                <Button onClick={() => setShowQr(true)} disabled={!on}>
                  <QrCode aria-hidden="true" className="size-4" />
                  QR code
                </Button>
                {on && (
                  <a
                    href={`/${profile.slug}/links`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles()}
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                    Open
                    <span className="sr-only"> your card in a new tab</span>
                  </a>
                )}
              </div>
              <p className="text-sm text-muted">
                Paste this link in your Instagram bio or WhatsApp status. In an email signature, use
                it as the address of a “Links” text.
                {!on && ' It starts working when you switch the card on.'}
              </p>
            </div>
          </Card>

          <Card className="space-y-3">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Look</legend>
              {(
                [
                  [
                    'light',
                    'Light',
                    'Clean white buttons with a thin border. The accent colors the main button.',
                  ],
                  [
                    'soft',
                    'Soft',
                    'Rounded, tinted buttons on a gentle wash of your accent color.',
                  ],
                ] as [LinkBioStyle, string, string][]
              ).map(([value, name, hint]) => (
                // eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is inside, its text is in the nested spans
                <label key={value} className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="link-bio-style"
                    className="mt-1 size-4"
                    checked={profile.linkBioStyle === value}
                    disabled={busy === 'style'}
                    onChange={() => change('style', { linkBioStyle: value })}
                  />
                  <span>
                    <span className="font-medium">{name}</span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </span>
                </label>
              ))}
              <p className="text-xs text-muted">
                Both use your accent color. If it is too light to read as text, the card uses a
                darker shade of it for text and borders.
              </p>
            </fieldset>
          </Card>

          <section aria-labelledby="link-bio-buttons" className="space-y-3">
            <div>
              <h3 id="link-bio-buttons" className="type-subsection">
                Your buttons
              </h3>
              <p className="text-sm text-muted">
                Up to {LINK_BIO_MAX_BUTTONS} buttons of your own, shown first. Drag to reorder, or
                use the arrows on a button’s handle with the keyboard. You can translate the button
                texts on the Languages page.
              </p>
            </div>
            <ListManager
              list={link}
              noun="button"
              addLabel="Add a button"
              icon={Link2}
              empty="No buttons yet. Add a link to your shop, your booking page, a playlist, anything you want people to reach from one tap."
              limit={LINK_BIO_MAX_BUTTONS}
              summary={(item) => ({
                title: item.label,
                subtitle: item.url.replace(/^https?:\/\//, ''),
              })}
              Form={ButtonForm}
            />
          </section>

          <Card className="space-y-1">
            <p className="font-medium">Buttons from your other features</p>
            <p className="text-sm text-muted">
              Your visible links always appear as buttons. These show only while their feature is
              on.
              {active.some(Boolean) ? '' : ' None of them is showing right now.'}
            </p>
            <ul className="divide-y divide-line">
              {optional.map(({ key, label, hint, unavailable }) => (
                <OptionalButton
                  key={key}
                  label={label}
                  hint={hint}
                  unavailable={unavailable}
                  checked={Boolean(profile[key])}
                  busy={busy === key}
                  onChange={() => change(key, { [key]: !profile[key] })}
                />
              ))}
            </ul>
            <p className="pt-2 text-xs text-muted">
              “View full portfolio” and the small “Made with Parichay” link are always there.
            </p>
          </Card>
        </div>

        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <PhonePreview>
            <LinkCard model={model} preview />
          </PhonePreview>
        </div>
      </div>

      <QrCodeDialog
        open={showQr}
        onClose={() => setShowQr(false)}
        url={url}
        slug={profile.slug}
        name={profile.fullName}
        published={profile.published && on}
        title="QR code for your link-in-bio card"
        description="Anyone who points a phone camera at this opens your card. Good for a business card, a poster or a slide."
        fileSuffix="-links"
      />
    </section>
  );
}
