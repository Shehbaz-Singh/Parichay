'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  ANNOUNCEMENT_LABEL_DEFAULT,
  ANNOUNCEMENT_LABEL_MAX,
  ANNOUNCEMENT_STYLES,
  ANNOUNCEMENT_STYLE_LABELS,
  ANNOUNCEMENT_TEXT_MAX,
  announcementSettingsSchema,
  type AnnouncementStyle,
  type MyProfile,
} from '@parichay/shared';
import {
  fromLocalInput,
  ownerZone,
  previewAnnouncement,
  scheduleSummary,
  stateText,
  toLocalInput,
  zoneName,
} from '@/lib/announcement';
import { api } from '@/lib/client-api';
import { NOTICES } from '@/lib/messages';
import { themeColors } from '@/lib/palette';
import { getTheme } from '@/lib/themes';
import { Button, Input, Switch } from '../../ui';
import { cx } from '../../ui/cx';
import { useEditor } from '../editor-context';

type Saved = Pick<
  MyProfile,
  | 'announcementEnabled'
  | 'announcementText'
  | 'announcementLinkUrl'
  | 'announcementLinkLabel'
  | 'announcementStyle'
  | 'announcementStartsAt'
  | 'announcementEndsAt'
  | 'announcementDismissible'
  | 'announcementScroll'
  | 'announcementVersion'
>;

const STYLE_HINTS: Record<AnnouncementStyle, string> = {
  info: 'A quiet tint with a thin edge',
  highlight: 'A soft fill of your accent color',
  notice: 'A solid fill of your accent color',
};

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-note`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-note`} role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// The announcement bar: a short line above the top of the page, with an optional link and schedule. It is
// saved with its own button (all of it together, so a change is one change), and the live preview shows
// what is typed as it is typed. The dates are typed on the clock of the owner's time zone and kept as UTC.
export function AnnouncementCard() {
  const { profile, update, attempt, setDraft } = useEditor();
  const ids = useId();
  const zone = ownerZone(profile);
  const textRef = useRef<HTMLInputElement>(null);

  const [enabled, setEnabled] = useState(profile.announcementEnabled);
  const [text, setText] = useState(profile.announcementText ?? '');
  const [linkUrl, setLinkUrl] = useState(profile.announcementLinkUrl ?? '');
  const [linkLabel, setLinkLabel] = useState(profile.announcementLinkLabel ?? '');
  const [style, setStyle] = useState<AnnouncementStyle>(profile.announcementStyle);
  const [startsLocal, setStartsLocal] = useState(toLocalInput(profile.announcementStartsAt, zone));
  const [endsLocal, setEndsLocal] = useState(toLocalInput(profile.announcementEndsAt, zone));
  const [dismissible, setDismissible] = useState(profile.announcementDismissible);
  const [scroll, setScroll] = useState(profile.announcementScroll);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const startsAt = fromLocalInput(startsLocal, zone);
  const endsAt = fromLocalInput(endsLocal, zone);

  // What would be sent, and what is wrong with it. A date that is typed but not a date is its own problem.
  const payload = {
    announcementEnabled: enabled,
    announcementText: text,
    announcementLinkUrl: linkUrl,
    announcementLinkLabel: linkLabel,
    announcementStyle: style,
    announcementStartsAt: startsAt,
    announcementEndsAt: endsAt,
    announcementDismissible: dismissible,
    announcementScroll: scroll,
  };
  const parsed = announcementSettingsSchema.safeParse(payload);
  const problems = useMemo(() => {
    const found: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) found[String(issue.path[0])] ??= issue.message;
    }
    if (startsLocal && !startsAt) found.announcementStartsAt = 'Enter a valid date and time';
    if (endsLocal && !endsAt) found.announcementEndsAt = 'Enter a valid date and time';
    return found;
  }, [parsed, startsLocal, endsLocal, startsAt, endsAt]);
  const shown = (field: string) => (submitted ? problems[field] : undefined);

  const saved = stateText(profile);
  const dirty =
    enabled !== profile.announcementEnabled ||
    text.trim() !== (profile.announcementText ?? '') ||
    linkUrl.trim() !== (profile.announcementLinkUrl ?? '') ||
    linkLabel.trim() !== (profile.announcementLinkLabel ?? '') ||
    style !== profile.announcementStyle ||
    startsAt !== profile.announcementStartsAt ||
    endsAt !== profile.announcementEndsAt ||
    dismissible !== profile.announcementDismissible ||
    scroll !== profile.announcementScroll;
  const endPassed = !!endsAt && Date.parse(endsAt) <= Date.now();

  // The live preview shows what is typed, before it is saved; closing the card goes back to the saved one.
  useEffect(() => {
    setDraft(
      {
        announcement:
          previewAnnouncement({
            enabled,
            text,
            linkUrl: linkUrl.trim() || null,
            linkLabel: linkLabel.trim() || null,
            style,
            dismissible,
            scroll,
            version: profile.announcementVersion,
          }) ?? null,
      },
      'announcement',
    );
  }, [
    enabled,
    text,
    linkUrl,
    linkLabel,
    style,
    dismissible,
    scroll,
    profile.announcementVersion,
    setDraft,
  ]);
  useEffect(() => () => setDraft(null, 'announcement'), [setDraft]);

  async function save() {
    setSubmitted(true);
    if (Object.keys(problems).length > 0) return;
    setBusy(true);
    const ok = await attempt(
      async () => {
        const result = await api<Saved>('/profile/me/announcement', {
          method: 'PUT',
          body: payload,
        });
        update((p) => ({ ...p, ...result }));
      },
      enabled ? NOTICES.announcementSaved : NOTICES.announcementOff,
    );
    setBusy(false);
    if (ok) setSubmitted(false);
  }

  // Ended: the same words, link and look come back with a clean schedule. Nothing is saved until the owner
  // has chosen new dates and pressed Save, so nothing goes live by surprise.
  function reuse() {
    setEnabled(true);
    setStartsLocal('');
    setEndsLocal('');
    setSubmitted(false);
    textRef.current?.focus();
  }

  const previewVars = useMemo(
    () => themeColors(getTheme(profile.theme).key, profile.accentColor).vars,
    [profile.theme, profile.accentColor],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-card border border-line p-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Show an announcement</p>
            <p className="text-xs text-muted">
              Keep it short and true. Visitors can close it, and it disappears on its own after the
              end date.
            </p>
          </div>
          <Switch
            checked={enabled}
            label="Show an announcement on my page"
            onClick={() => setEnabled(!enabled)}
          />
        </div>

        <p
          className={cx(
            'rounded-control px-3 py-2 text-sm',
            saved.state === 'live' ? 'bg-accent-soft' : 'bg-surface text-muted',
          )}
          data-state={saved.state}
        >
          <span className="font-medium">{saved.text}</span>
          {saved.state === 'ended' && (
            <Button size="sm" className="ms-3" onClick={reuse}>
              Duplicate and reuse
            </Button>
          )}
        </p>
        {!profile.published && (
          <p className="rounded-control bg-surface px-3 py-2 text-sm text-muted">
            Publish your page for the announcement to be seen. Visitors only see a live page.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Field
          id={`${ids}-text`}
          label="Announcement"
          error={shown('announcementText')}
          hint="Plain text, one or two lines. For example: Speaking at DevFest on Dec 5."
        >
          <Input
            id={`${ids}-text`}
            ref={textRef}
            value={text}
            maxLength={ANNOUNCEMENT_TEXT_MAX}
            autoComplete="off"
            aria-invalid={!!shown('announcementText')}
            aria-describedby={`${ids}-text-note ${ids}-count`}
            onChange={(e) => setText(e.target.value)}
          />
          <p
            id={`${ids}-count`}
            className={cx(
              'mt-1 text-end text-xs tabular-nums text-muted',
              text.length >= ANNOUNCEMENT_TEXT_MAX - 10 && 'font-medium text-danger',
            )}
          >
            {text.length}/{ANNOUNCEMENT_TEXT_MAX}
            <span className="sr-only"> characters</span>
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field
            id={`${ids}-url`}
            label="Link (optional)"
            error={shown('announcementLinkUrl')}
            hint="Starts with https:// or http://"
          >
            <Input
              id={`${ids}-url`}
              type="url"
              inputMode="url"
              value={linkUrl}
              autoComplete="off"
              placeholder="https://"
              aria-invalid={!!shown('announcementLinkUrl')}
              aria-describedby={`${ids}-url-note`}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </Field>
          <Field
            id={`${ids}-label`}
            label="Link text"
            error={shown('announcementLinkLabel')}
            hint={`Left empty it says “${ANNOUNCEMENT_LABEL_DEFAULT}”`}
          >
            <Input
              id={`${ids}-label`}
              value={linkLabel}
              maxLength={ANNOUNCEMENT_LABEL_MAX}
              disabled={!linkUrl.trim()}
              autoComplete="off"
              aria-invalid={!!shown('announcementLinkLabel')}
              aria-describedby={`${ids}-label-note`}
              onChange={(e) => setLinkLabel(e.target.value)}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Look</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {ANNOUNCEMENT_STYLES.map((value) => (
              <label key={value} className="block cursor-pointer">
                <input
                  type="radio"
                  name={`${ids}-style`}
                  value={value}
                  checked={style === value}
                  onChange={() => setStyle(value)}
                  className="peer sr-only"
                />
                <span className="block overflow-hidden rounded-control border border-line peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                  <span
                    className="ann block"
                    data-style={value}
                    style={previewVars as CSSProperties}
                    aria-hidden="true"
                  >
                    <span className="ann-inner">
                      <span className="ann-text">Sample text</span>
                    </span>
                  </span>
                </span>
                <span className="mt-1 block text-sm font-medium">
                  {ANNOUNCEMENT_STYLE_LABELS[value]}
                </span>
                <span className="block text-xs text-muted">{STYLE_HINTS[value]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Schedule (optional)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${ids}-from`}
              label="Show from"
              error={shown('announcementStartsAt')}
              hint="Empty: as soon as you save"
            >
              <Input
                id={`${ids}-from`}
                type="datetime-local"
                value={startsLocal}
                aria-invalid={!!shown('announcementStartsAt')}
                aria-describedby={`${ids}-from-note`}
                onChange={(e) => setStartsLocal(e.target.value)}
              />
            </Field>
            <Field
              id={`${ids}-until`}
              label="Hide after"
              error={shown('announcementEndsAt')}
              hint="Empty: until you switch it off. At most 12 months from now"
            >
              <Input
                id={`${ids}-until`}
                type="datetime-local"
                value={endsLocal}
                aria-invalid={!!shown('announcementEndsAt')}
                aria-describedby={`${ids}-until-note`}
                onChange={(e) => setEndsLocal(e.target.value)}
              />
            </Field>
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {scheduleSummary({ startsAt, endsAt }, zone)}
          </p>
          <p className="text-xs text-muted">
            Times are on the clock of {zone.replace(/_/g, ' ')} ({zoneName(zone)})
            {profile.timezone
              ? ', the time zone of your Working together card.'
              : ', your browser’s time zone. Set one on the Working together card to choose another.'}
          </p>
          {endPassed && (
            <p
              role="note"
              className="rounded-control bg-surface px-3 py-2 text-sm font-medium text-danger"
            >
              That end time has already passed, so the announcement will not show.
            </p>
          )}
        </fieldset>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Scroll the text</p>
            <p className="text-xs text-muted">
              The line slowly moves along the bar. It stops when a visitor points at it or uses the
              pause button, and it stays still for visitors who have asked their device for less
              motion.
            </p>
          </div>
          <Switch
            checked={scroll}
            label="Scroll the announcement text"
            onClick={() => setScroll(!scroll)}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Let visitors close it</p>
            <p className="text-xs text-muted">
              A close button. It stays closed for the visit only, on their device, and comes back
              when they reopen your page. If you change the text, link or dates, it shows again.
            </p>
          </div>
          <Switch
            checked={dismissible}
            label="Let visitors close the announcement"
            onClick={() => setDismissible(!dismissible)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" loading={busy} disabled={!dirty || busy} onClick={save}>
          {busy ? 'Saving…' : 'Save announcement'}
        </Button>
        {submitted && Object.keys(problems).length > 0 && (
          <p role="alert" className="text-sm font-medium text-danger">
            Fix the highlighted fields to save.
          </p>
        )}
      </div>
    </div>
  );
}
