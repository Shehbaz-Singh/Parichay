'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Code2, Copy, Download, FileText, TriangleAlert } from 'lucide-react';
import { languageOf, type MyProfile, type StoredTranslation } from '@parichay/shared';
import { api } from '@/lib/client-api';
import { ACCENT_PRESETS, normalizeHex } from '@/lib/color';
import { SITE_URL } from '@/lib/config';
import { copyToClipboard } from '@/lib/hooks';
import { NOTICES, PROBLEMS } from '@/lib/messages';
import {
  CUSTOM_LINE_MAX,
  DARK,
  FIELD_KEYS,
  SIGNATURE_STYLES,
  buildSignature,
  contrastOnDark,
  contrastOnWhite,
  signatureDocument,
  type FieldKey,
  type SignatureSource,
  type SignatureStyle,
} from '@/lib/signature/build';
import { Button, Card, Input, Select } from '../ui';
import { cx } from '../ui/cx';
import { useEditor } from './editor-context';

const FIELD_LABELS: Record<FieldKey, string> = {
  role: 'Role line',
  location: 'Location',
  portfolio: 'Portfolio link',
  email: 'Email',
  phone: 'Phone',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  website: 'Website',
};

const CLIENTS = [
  {
    name: 'Gmail',
    steps: [
      'Copy the signature with the button above.',
      'In Gmail, open Settings, then See all settings, and find the Signature section.',
      'Create a new signature (or choose one to replace), click in the box and paste.',
      'Save your changes at the bottom of the page.',
    ],
    help: 'https://support.google.com/mail/answer/8395',
  },
  {
    name: 'Outlook (desktop and web)',
    steps: [
      'Copy the signature with the button above.',
      'Open the signature settings: in Outlook on the web they are under Settings, Mail, Compose and reply; in the desktop app, under the options for Mail and Signatures.',
      'Create a new signature, click in the editing box and paste.',
      'Save, and choose it as the default for new messages and replies if you like.',
    ],
    help: 'https://support.microsoft.com/en-us/office/create-and-add-an-email-signature-in-outlook-8ee5d4f4-68fd-464a-a1c1-0e1c80bb27f2',
  },
  {
    name: 'Apple Mail',
    steps: [
      'Copy the signature with the button above.',
      'Open Mail’s settings and find the Signatures tab.',
      'Add a signature, then paste into its editing box. If Mail changes the look, the Apple help page explains how to keep your own formatting.',
    ],
    help: 'https://support.apple.com/guide/mail/add-and-use-email-signatures-mail11943/mac',
  },
  {
    name: 'Thunderbird',
    steps: [
      'Thunderbird takes a signature as HTML code, so use “Copy HTML code” or download the .html file.',
      'Open the settings for your email account and find the signature option. Choose to attach the signature from a file, or paste HTML if your version offers it.',
      'Check a test message before relying on it.',
    ],
    help: 'https://support.thunderbird.net/',
    unverified: true,
  },
];

// The language the signature is written in: the default one, or one of the extra ones.
function useLocalizedRole(profile: MyProfile, locale: string, enabled = true) {
  const isDefault = locale === profile.defaultLocale;
  const [loaded, setLoaded] = useState<{ locale: string; tagline: string } | null>(null);

  useEffect(() => {
    if (isDefault || !enabled) return;
    const controller = new AbortController();
    api<{ entries: StoredTranslation[] }>(`/profile/me/translations/${locale}`, {
      signal: controller.signal,
    }).then(
      ({ entries }) => {
        const entry = entries.find((e) => e.entityType === 'profile' && e.field === 'tagline');
        setLoaded({ locale, tagline: entry?.value.trim() ?? '' });
      },
      () => {
        if (!controller.signal.aborted) setLoaded({ locale, tagline: '' });
      },
    );
    return () => controller.abort();
  }, [isDefault, enabled, locale]);

  if (isDefault) return { role: profile.tagline ?? '', loading: false };
  const ready = loaded?.locale === locale;
  // A language without a translated line shows the main language's, as the page itself does.
  return { role: (ready && loaded.tagline) || (profile.tagline ?? ''), loading: enabled && !ready };
}

const ratio = (n: number) => `${n.toFixed(1)}:1`;

function useCopyNotice() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    message,
    say(text: string) {
      // Cleared first so the same text said twice is announced twice.
      setMessage('');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setMessage(text);
        timer.current = setTimeout(() => setMessage(''), 4000);
      }, 30);
    },
  };
}

// Your own signature in one style, shrunk to fit a card. It is the real HTML, so the card shows
// your name, your photo and your colors. It cannot be clicked or focused: the card is the control.
const MINI_SCALE = 0.62;
function Miniature({ html }: { html: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none block h-28 overflow-hidden rounded-control border border-slate-200 bg-white"
    >
      <span
        className="block p-3"
        style={{
          width: `${100 / MINI_SCALE}%`,
          transform: `scale(${MINI_SCALE})`,
          transformOrigin: 'top left',
          color: '#1a1a1a',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </span>
  );
}

// Email signature generator: a style, the fields, and a preview of exactly the HTML that is copied.
export function SignatureGenerator() {
  const { profile } = useEditor();
  const id = useId();

  const [style, setStyle] = useState<SignatureStyle>('card');
  const [accentChoice, setAccentChoice] = useState<string | null>(null);
  const [locale, setLocale] = useState(profile.defaultLocale);
  const [roleDraft, setRoleDraft] = useState<string | null>(null);
  const [customLine, setCustomLine] = useState('');
  const [includeBadge, setIncludeBadge] = useState(false);
  const [serifName, setSerifName] = useState(false);
  const [dark, setDark] = useState(false);
  const [phone, setPhone] = useState(false);
  const [fields, setFields] = useState<Record<FieldKey, boolean>>(
    () =>
      Object.fromEntries(
        FIELD_KEYS.map((key) => [key, key === 'role' || key === 'portfolio']),
      ) as Record<FieldKey, boolean>,
  );
  const { message, say } = useCopyNotice();
  const frame = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(140);

  const accent = normalizeHex(accentChoice) ?? normalizeHex(profile.accentColor) ?? '#2563eb';
  const localized = useLocalizedRole(profile, locale);
  const role = roleDraft ?? localized.role;
  // The Bilingual style pairs the chosen language with another one the profile offers.
  const languages = [profile.defaultLocale, ...profile.locales];
  const secondLocale = languages.find((code) => code !== locale) ?? null;
  const secondRole = useLocalizedRole(
    profile,
    secondLocale ?? profile.defaultLocale,
    style === 'bilingual' && secondLocale !== null,
  );

  // Only the contact links the owner shows on the page. A hidden one is never read.
  const contacts = useMemo(() => {
    const first = (type: string) => profile.links.find((l) => l.visible && l.type === type)?.url;
    return {
      email: first('email'),
      phone: first('phone'),
      linkedin: first('linkedin'),
      github: first('github'),
      website: first('website'),
    };
  }, [profile.links]);

  const source: SignatureSource = {
    name: profile.fullName,
    role: localized.role,
    location: profile.location,
    siteUrl: SITE_URL,
    slug: profile.slug,
    locale,
    defaultLocale: profile.defaultLocale,
    avatarUrl: profile.avatarUrl,
    accent,
    contacts,
    second: secondLocale ? { locale: secondLocale, role: secondRole.role } : null,
  };
  const signature = buildSignature(source, {
    style,
    accent,
    role,
    customLine,
    fields,
    includeBadge,
    serifName,
  });

  // One small version of each style, built from the same choices as the real signature.
  const miniatures = Object.fromEntries(
    SIGNATURE_STYLES.map((option) => [
      option.key,
      buildSignature(source, {
        style: option.key,
        accent,
        role,
        customLine,
        fields,
        includeBadge,
        serifName,
      }).html,
    ]),
  ) as Record<SignatureStyle, string>;

  const preview = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:16px;background:${dark ? DARK : '#ffffff'};color:${dark ? '#f2f2f7' : '#1a1a1a'};">${signature.html}</body></html>`,
    [signature.html, dark],
  );

  function fitFrame() {
    const doc = frame.current?.contentDocument;
    if (doc) setFrameHeight(Math.max(60, doc.documentElement.scrollHeight));
  }

  // ---- Copying

  async function copyRich() {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('no API');
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([signature.html], { type: 'text/html' }),
          'text/plain': new Blob([signature.text], { type: 'text/plain' }),
        }),
      ]);
      say(NOTICES.signatureCopied);
    } catch {
      // The older way: select what the preview shows and copy the selection.
      const win = frame.current?.contentWindow;
      const doc = frame.current?.contentDocument;
      let done = false;
      if (win && doc) {
        const range = doc.createRange();
        range.selectNodeContents(doc.body);
        const selection = win.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        win.focus();
        try {
          done = doc.execCommand('copy');
        } catch {
          done = false;
        }
        selection?.removeAllRanges();
      }
      say(done ? NOTICES.signatureCopied : PROBLEMS.signatureCopy);
    }
  }

  async function copyText(value: string, ok: string) {
    say((await copyToClipboard(value)) ? ok : PROBLEMS.signatureCopy);
  }

  function download() {
    const file = new Blob(
      [signatureDocument(signature.html, `${profile.fullName} email signature`)],
      {
        type: 'text/html;charset=utf-8',
      },
    );
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-signature-${profile.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
    say(NOTICES.signatureDownloaded);
  }

  // ---- Pieces of the form

  const white = contrastOnWhite(accent);
  const onDark = contrastOnDark(signature.linkColor);
  const badgeAllowed = style === 'card' || style === 'stacked';
  const badgeOn = style === 'banner' || (badgeAllowed && includeBadge);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-muted">
        Pick a style and copy a signature made from your saved profile. Hidden contact links are
        never included, and nothing here is saved or sent anywhere: the signature is built in your
        browser.
      </p>

      {!profile.published && (
        <Card tone="warning" padding="sm" role="status" className="flex gap-2 text-sm">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>Your portfolio is not published.</strong> You can preview the signature, but its
            portfolio link and badge will not work for anyone until you publish.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Style</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {SIGNATURE_STYLES.map((option) => {
                const selected = style === option.key;
                const unavailable = option.key === 'bilingual' && !secondLocale;
                return (
                  <label
                    key={option.key}
                    className={cx(
                      unavailable && 'cursor-not-allowed opacity-60',
                      'group relative flex cursor-pointer flex-col gap-2 rounded-control border p-2.5 text-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                      selected
                        ? 'border-accent bg-accent-soft ring-1 ring-accent'
                        : 'border-line hover:bg-surface',
                    )}
                  >
                    <Miniature html={miniatures[option.key]} />
                    <span className="flex items-start gap-2">
                      <input
                        type="radio"
                        name={`${id}-style`}
                        value={option.key}
                        checked={selected}
                        disabled={unavailable}
                        onChange={() => setStyle(option.key)}
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{option.name}</span>
                        <span className="block text-xs text-muted">
                          {unavailable
                            ? 'Add a second language under Languages to use this.'
                            : option.hint}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={serifName}
              onChange={(e) => setSerifName(e.target.checked)}
            />
            Set the name in a serif font (Georgia)
          </label>

          <section aria-labelledby={`${id}-accent`} className="space-y-2">
            <h2 id={`${id}-accent`} className="text-sm font-semibold">
              Link color
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                aria-label="Link color"
                value={accent}
                onChange={(e) => setAccentChoice(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-control border border-line bg-page p-1"
              />
              <code className="text-sm">{accent}</code>
              <Button
                size="sm"
                onClick={() => setAccentChoice(null)}
                disabled={accentChoice === null}
              >
                Use my accent
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested colors">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  aria-label={`${preset.name} ${preset.hex}`}
                  aria-pressed={accent === preset.hex}
                  onClick={() => setAccentChoice(preset.hex)}
                  style={{ background: preset.hex }}
                  className={cx(
                    'size-6 rounded-full border border-line',
                    accent === preset.hex && 'ring-2 ring-ink ring-offset-2 ring-offset-page',
                  )}
                />
              ))}
            </div>
            <ul className="space-y-1 text-sm" aria-label="Contrast of the link color">
              <li>
                On white: {ratio(white)}{' '}
                <span className="text-muted">
                  {white >= 4.5 ? '(passes WCAG AA)' : '(too low)'}
                </span>
              </li>
              <li>
                On dark ({DARK}): {ratio(onDark)}{' '}
                <span className="text-muted">
                  {onDark >= 4.5
                    ? '(passes WCAG AA)'
                    : onDark >= 3
                      ? '(readable, not AA for small text)'
                      : '(low)'}
                </span>
              </li>
            </ul>
            {signature.linkColor !== accent && (
              <p className="text-sm text-muted">
                Links in the signature use {signature.linkColor}, a darker shade of this color, so
                they stay readable on white.
              </p>
            )}
            <p className="text-sm text-muted">
              No single color reaches 4.5:1 on both white and dark, so check both previews. Text
              itself takes the reader’s own color, so it reads in either mode.
            </p>
          </section>

          <section aria-labelledby={`${id}-content`} className="space-y-3">
            <h2 id={`${id}-content`} className="text-sm font-semibold">
              Content
            </h2>
            {languages.length > 1 && (
              <div className="space-y-1">
                <label htmlFor={`${id}-lang`} className="block text-sm font-medium">
                  Language
                </label>
                <Select
                  id={`${id}-lang`}
                  value={locale}
                  options={languages.map((code) => ({
                    value: code,
                    label: `${languageOf(code).name} (${languageOf(code).nativeName})`,
                  }))}
                  onChange={(code) => {
                    setLocale(code);
                    setRoleDraft(null);
                  }}
                />
                <p className="text-sm text-muted">
                  Sets the role line and the link to the page in that language.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor={`${id}-role`} className="block text-sm font-medium">
                Role line
              </label>
              <Input
                id={`${id}-role`}
                value={role}
                maxLength={160}
                lang={languageOf(locale).code}
                dir={languageOf(locale).dir}
                onChange={(e) => setRoleDraft(e.target.value)}
                aria-describedby={`${id}-role-help`}
              />
              <p id={`${id}-role-help`} className="text-sm text-muted">
                Starts as your tagline. Changing it here does not change your profile.
                {localized.loading && ' Loading the translation…'}
              </p>
            </div>

            <fieldset className="space-y-1">
              <legend className="mb-1 text-sm font-medium">Include</legend>
              <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {FIELD_KEYS.map((key) => {
                  const value =
                    key === 'location'
                      ? profile.location
                      : key === 'role'
                        ? role
                        : key === 'portfolio'
                          ? profile.slug
                          : contacts[key];
                  const missing = !value;
                  return (
                    <li key={key}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4"
                          disabled={missing}
                          checked={fields[key] && !missing}
                          onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.checked }))}
                        />
                        <span className={missing ? 'text-muted' : undefined}>
                          {FIELD_LABELS[key]}
                          {missing && ' (none to show)'}
                        </span>
                      </label>
                    </li>
                  );
                })}
                <li>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      disabled={!badgeAllowed}
                      checked={badgeOn}
                      onChange={(e) => setIncludeBadge(e.target.checked)}
                    />
                    <span className={!badgeAllowed ? 'text-muted' : undefined}>
                      Badge image
                      {style === 'banner' && ' (part of this style)'}
                      {style !== 'banner' && !badgeAllowed && ' (Card, Stacked or Banner only)'}
                    </span>
                  </label>
                </li>
              </ul>
              <p className="text-sm text-muted">
                Only links you show on your page are offered. Hidden ones never appear here.
              </p>
            </fieldset>

            <div className="space-y-1">
              <label htmlFor={`${id}-custom`} className="block text-sm font-medium">
                Extra line (optional)
              </label>
              <Input
                id={`${id}-custom`}
                value={customLine}
                maxLength={CUSTOM_LINE_MAX}
                onChange={(e) => setCustomLine(e.target.value)}
                aria-describedby={`${id}-custom-help`}
              />
              <p id={`${id}-custom-help`} className="text-sm text-muted">
                Plain text, up to {CUSTOM_LINE_MAX} characters ({customLine.length} used). Not saved
                to your profile.
              </p>
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Preview</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={dark}
                  onChange={(e) => setDark(e.target.checked)}
                />
                Show on a dark background
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={phone}
                  onChange={(e) => setPhone(e.target.checked)}
                />
                Show at phone width
              </label>
            </div>
          </div>

          <div
            role="region"
            aria-label={`Signature preview on a ${dark ? 'dark' : 'white'} background${phone ? ', at phone width' : ''}`}
            style={phone ? { maxWidth: 375 } : undefined}
            className="mx-auto overflow-x-auto rounded-card border border-line"
          >
            <iframe
              ref={frame}
              title={`Email signature preview, ${dark ? 'dark' : 'white'} background${phone ? ', phone width' : ''}`}
              sandbox="allow-same-origin"
              srcDoc={preview}
              onLoad={fitFrame}
              style={{ height: frameHeight }}
              className="block w-full min-w-72 border-0"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={copyRich}>
              <Copy aria-hidden="true" className="size-4" />
              Copy signature
            </Button>
            <Button onClick={() => copyText(signature.html, NOTICES.signatureHtmlCopied)}>
              <Code2 aria-hidden="true" className="size-4" />
              Copy HTML code
            </Button>
            <Button onClick={() => copyText(signature.text, NOTICES.signatureTextCopied)}>
              <FileText aria-hidden="true" className="size-4" />
              Copy plain text version
            </Button>
            <Button onClick={download}>
              <Download aria-hidden="true" className="size-4" />
              Download as .html
            </Button>
          </div>
          <p role="status" aria-live="polite" className="min-h-5 text-sm font-medium">
            {message && (
              <>
                <Check aria-hidden="true" className="mr-1 inline size-4" />
                {message}
              </>
            )}
          </p>

          <p className="text-sm text-muted">
            Size: {(signature.bytes / 1024).toFixed(1)} KB
            {signature.bytes > 10 * 1024 &&
              ' (larger than the 10 KB aim; remove a field to shrink it)'}
          </p>

          {signature.skipped.length > 0 && (
            <Card tone="warning" padding="sm" className="text-sm">
              <p className="font-medium">Left out of this signature:</p>
              <ul className="list-disc pl-5">
                {signature.skipped.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          )}

          {signature.usesImages && (
            <Card tone="warning" padding="sm" className="flex gap-2 text-sm">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                Many mail apps block remote images until the reader allows them. This signature is
                complete without its images: your name, role and links are text, and the images have
                descriptive alt text. Choose Plain, Letterhead, Initials, Bilingual or Reply for no
                images at all.
              </p>
            </Card>
          )}

          <section aria-labelledby={`${id}-install`} className="space-y-2">
            <h2 id={`${id}-install`} className="text-sm font-semibold">
              How to add it to your email
            </h2>
            <p className="text-sm text-muted">
              Mail apps change their menus from time to time, so these steps are general and may
              differ in your version. The official help page for each is linked.
            </p>
            {CLIENTS.map((client) => (
              <details key={client.name} className="rounded-control border border-line p-3 text-sm">
                <summary className="cursor-pointer font-medium">{client.name}</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  {client.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="mt-2">
                  <a
                    href={client.help}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-fg underline"
                  >
                    Official help for {client.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  {client.unverified && (
                    <span className="text-muted">
                      {' '}
                      (this is the general Thunderbird support site; we could not check a more
                      specific page)
                    </span>
                  )}
                </p>
              </details>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
