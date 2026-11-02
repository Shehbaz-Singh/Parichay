'use client';

import Link from 'next/link';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type { ZodIssue } from 'zod';
import {
  CONTACT_EMAIL_MAX,
  CONTACT_HONEYPOT_FIELD,
  CONTACT_MAX_LINKS,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_NAME_MAX,
  CONTACT_SUBJECT_MAX,
  TOO_MANY_LINKS,
  contactMessageInputSchema,
  type ContactFormInfo,
} from '@parichay/shared';
import { ApiError, api } from '@/lib/client-api';
import { fill } from '@/lib/i18n';
import { Button, Input, Textarea } from '../ui';
import type { ContactFormModel } from './blocks';

// The contact form of the public page. It is a real <form> that posts to the site (a route that
// forwards to the API and comes back to the form's own page), so it works without JavaScript; with
// JavaScript it sends the message in the background and shows the answer in place.
//
// Two ways to show it. "inline" (in a theme's Contact section) is a link that, once the page is live,
// opens the form right there; the link goes to the form's own page for visitors without JavaScript.
// "page" is that page: the form is open from the start, and the server has already got the signed
// time stamp (the page is never cached, so the stamp is fresh).
//
// Nothing about the visitor is stored or counted here, and no analytics event is sent (there is no
// analytics system). The owner's email address never reaches this component.

type Field = 'senderName' | 'senderEmail' | 'subject' | 'message';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

// What the page says after a form post without JavaScript.
export type ContactStatus = 'sent' | 'invalid' | 'expired' | 'busy' | 'captcha' | 'failed';

export interface ContactPageState {
  token: string;
  captchaKey: string | null;
  status?: ContactStatus;
}

const EMPTY: Values = { senderName: '', senderEmail: '', subject: '', message: '' };
const FIELDS: Field[] = ['senderName', 'senderEmail', 'subject', 'message'];

// ---- Cloudflare Turnstile, loaded only when a form that needs it is opened

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  reset: (widget?: string) => void;
  remove: (widget?: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileLoading: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  turnstileLoading ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing'));
    script.onerror = () => {
      turnstileLoading = null; // a later open may try again
      reject(new Error('Turnstile did not load'));
    };
    document.head.append(script);
  });
  return turnstileLoading;
}

// ---- checking what was typed, with the page's own words

function messageFor(
  field: Field,
  issue: ZodIssue,
  value: string,
  ui: ContactFormModel['ui'],
): string {
  if (field !== 'subject' && !value.trim()) return ui.needed;
  switch (issue.code) {
    case 'too_small':
      return fill(ui.tooShort, { min: Number(issue.minimum) });
    case 'too_big':
      return fill(ui.tooLong, { max: Number(issue.maximum) });
    case 'invalid_string':
      return ui.emailInvalid;
    case 'custom':
      return issue.message === TOO_MANY_LINKS
        ? fill(ui.links, { max: CONTACT_MAX_LINKS })
        : ui.tags;
    default:
      return ui.needed;
  }
}

function check(values: Values, ui: ContactFormModel['ui']): Errors {
  const found: Errors = {};
  const parsed = contactMessageInputSchema.safeParse(values);
  if (parsed.success) return found;
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as Field;
    if (FIELDS.includes(field) && !found[field]) {
      found[field] = messageFor(field, issue, values[field], ui);
    }
  }
  return found;
}

// ---- a labelled field

function Labelled({
  id,
  label,
  required,
  requiredWord,
  hint,
  error,
  extra,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  requiredWord: string;
  hint?: string;
  error?: string;
  extra?: string; // the character counter
  children: (describedBy: string | undefined) => ReactNode;
}) {
  const ids = [hint && `${id}-hint`, extra && `${id}-extra`, error && `${id}-error`].filter(
    Boolean,
  );
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="font-normal text-muted"> ({requiredWord})</span>}
      </label>
      {children(ids.length > 0 ? ids.join(' ') : undefined)}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {extra && (
        <p id={`${id}-extra`} className="mt-1 text-xs text-muted">
          {extra}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ---- the form

export function ContactForm({
  form,
  buttonClassName = '',
  page,
  hideIntro = false,
  label,
}: {
  form: ContactFormModel;
  buttonClassName?: string; // the theme's look for the "Send a message" link
  page?: ContactPageState; // set on the form's own page
  hideIntro?: boolean; // no line above the link while the form is closed (the link-in-bio card)
  label?: string; // the words of the link, "Send a message" when left out
}) {
  const { ui, slug } = form;
  const [phase, setPhase] = useState<'closed' | 'loading' | 'ready' | 'sent'>(
    page ? (page.status === 'sent' ? 'sent' : 'ready') : 'closed',
  );
  const [token, setToken] = useState(page?.token ?? '');
  const [captchaKey, setCaptchaKey] = useState<string | null>(page?.captchaKey ?? null);
  const [captcha, setCaptcha] = useState('');
  const [values, setValues] = useState<Values>(EMPTY);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const id = useId();
  const headingId = `${id}-heading`;
  const link = useRef<HTMLAnchorElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);
  const captchaBox = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const moved = useRef(false); // the visitor has opened the form (so there is something to refocus)

  const fieldId = (field: Field) => `${id}-${field}`;
  const problems: Record<Exclude<ContactStatus, 'sent'>, string> = {
    invalid: ui.fixErrors,
    expired: ui.expired,
    busy: ui.busy,
    captcha: ui.captcha,
    failed: ui.failed,
  };
  // The page's own problem (a post without JavaScript came back), until the visitor does anything.
  const shownNotice =
    notice ?? (page?.status && page.status !== 'sent' ? problems[page.status] : null);

  // Keyboard and screen reader users follow the change: into the first field when the form opens,
  // onto the thanks when it is sent, onto the problem when the page came back with one, and back on
  // the link when the form is closed.
  useEffect(() => {
    if (phase === 'ready' && moved.current) {
      panel.current?.querySelector<HTMLElement>('input:not([type=hidden])')?.focus();
    } else if (phase === 'sent') {
      panel.current?.focus();
    } else if (phase === 'closed' && moved.current) {
      link.current?.focus();
    }
  }, [phase]);
  useEffect(() => {
    if (page?.status && page.status !== 'sent') alert.current?.focus();
    else if (page?.status === 'sent') panel.current?.focus();
  }, [page?.status]);

  // The Turnstile widget, when the server asks for one.
  useEffect(() => {
    if (phase !== 'ready' || !captchaKey || !captchaBox.current) return;
    let cancelled = false;
    const box = captchaBox.current;
    loadTurnstile().then(
      (turnstile) => {
        if (cancelled) return;
        widget.current = turnstile.render(box, {
          sitekey: captchaKey,
          callback: setCaptcha,
          'expired-callback': () => setCaptcha(''),
          'error-callback': () => setCaptcha(''),
        });
      },
      () => setNotice(ui.captcha),
    );
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = undefined;
      setCaptcha('');
    };
  }, [phase, captchaKey, ui.captcha]);

  async function loadInfo(): Promise<boolean> {
    try {
      const info = await api<ContactFormInfo>(`/public/${encodeURIComponent(slug)}/contact`, {
        redirectOn401: false,
      });
      setToken(info.token);
      setCaptchaKey(info.captcha?.siteKey ?? null);
      return true;
    } catch {
      return false;
    }
  }

  async function open(e: MouseEvent<HTMLAnchorElement>) {
    // A new tab or window keeps the link's own behaviour.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    moved.current = true;
    setNotice(null);
    setPhase('loading');
    if (await loadInfo()) setPhase('ready');
    else {
      setNotice(ui.failed);
      setPhase('closed');
    }
  }

  const change = (field: Field) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: e.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function showProblem(found: Errors, text: string) {
    setErrors(found);
    setNotice(text);
    const first = FIELDS.find((field) => found[field]);
    if (first) document.getElementById(fieldId(first))?.focus();
    else alert.current?.focus();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const found = check(values, ui);
    if (Object.keys(found).length > 0) return showProblem(found, ui.fixErrors);
    if (captchaKey && !captcha) return showProblem({}, ui.captchaNeeded);

    setErrors({});
    setNotice(null);
    setSending(true);
    try {
      await api(`/public/${encodeURIComponent(slug)}/contact`, {
        method: 'POST',
        body: { ...values, [CONTACT_HONEYPOT_FIELD]: website, formToken: token, captcha },
        redirectOn401: false,
      });
      setPhase('sent');
    } catch (err) {
      if (!(err instanceof ApiError)) return showProblem({}, ui.failed);
      if (err.code === 'FORM_EXPIRED') {
        await loadInfo(); // a fresh stamp; the text is kept, so sending again is enough
        return showProblem({}, ui.expired);
      }
      if (err.code === 'CAPTCHA_FAILED') {
        if (widget.current) window.turnstile?.reset(widget.current);
        setCaptcha('');
        return showProblem({}, ui.captcha);
      }
      if (err.status === 429) return showProblem({}, ui.busy);
      const fromServer: Errors = {};
      for (const detail of err.details) {
        const field = detail.path as Field;
        if (FIELDS.includes(field) && !fromServer[field]) fromServer[field] = detail.message;
      }
      if (Object.keys(fromServer).length > 0) return showProblem(fromServer, ui.fixErrors);
      showProblem({}, ui.failed);
    } finally {
      setSending(false);
    }
  }

  const sendAction = `/${encodeURIComponent(slug)}/contact/send${
    form.pageHref.includes('?') ? form.pageHref.slice(form.pageHref.indexOf('?')) : ''
  }`;

  // ---- thanks

  if (phase === 'sent') {
    return (
      <div
        ref={panel}
        tabIndex={-1}
        role="status"
        className="rounded-xl border border-line p-5 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-accent-fg"
      >
        <p className="font-semibold">{ui.thanks}</p>
        <p className="mt-1 text-muted">{fill(ui.honest, { name: form.ownerName })}</p>
        {page && (
          <p className="mt-3">
            <Link
              href={form.homeHref}
              className="text-accent-fg underline underline-offset-2 hover:no-underline"
            >
              {fill(ui.back, { name: form.ownerName })}
            </Link>
          </p>
        )}
      </div>
    );
  }

  // ---- the link that opens the form

  if (phase === 'closed' || phase === 'loading') {
    return (
      <div className="[overflow-wrap:anywhere]">
        {!hideIntro && <p className="mb-4 text-muted">{form.intro}</p>}
        <a
          ref={link}
          href={form.pageHref}
          className={buttonClassName}
          onClick={open}
          aria-busy={phase === 'loading' || undefined}
        >
          {label ?? ui.open}
        </a>
        {notice && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {notice}
          </p>
        )}
      </div>
    );
  }

  // ---- the form

  const length = values.message.length;
  return (
    <div
      ref={panel}
      {...(!page && { role: 'group', 'aria-labelledby': headingId })}
      className={`[overflow-wrap:anywhere] ${page ? '' : 'rounded-xl border border-line bg-page p-5'}`}
    >
      {!page && (
        <h3 id={headingId} className="mb-1 text-lg font-semibold">
          {ui.open}
        </h3>
      )}
      <p className={page ? 'text-muted' : 'text-sm text-muted'}>{form.intro}</p>
      <p className="mt-2 mb-4 text-sm text-muted">{fill(ui.honest, { name: form.ownerName })}</p>

      <form noValidate method="post" action={sendAction} onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="formToken" value={token} />
        {shownNotice && (
          <p
            ref={alert}
            tabIndex={-1}
            role="alert"
            className="rounded-control border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger focus-visible:outline-2 focus-visible:outline-accent-fg"
          >
            {shownNotice}
          </p>
        )}

        <Labelled
          id={fieldId('senderName')}
          label={ui.name}
          required
          requiredWord={ui.required}
          error={errors.senderName}
        >
          {(describedBy) => (
            <Input
              id={fieldId('senderName')}
              name="senderName"
              value={values.senderName}
              onChange={change('senderName')}
              maxLength={CONTACT_NAME_MAX}
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.senderName ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </Labelled>

        <Labelled
          id={fieldId('senderEmail')}
          label={ui.email}
          required
          requiredWord={ui.required}
          hint={fill(ui.emailHint, { name: form.ownerName })}
          error={errors.senderEmail}
        >
          {(describedBy) => (
            <Input
              id={fieldId('senderEmail')}
              name="senderEmail"
              type="email"
              dir="ltr"
              value={values.senderEmail}
              onChange={change('senderEmail')}
              maxLength={CONTACT_EMAIL_MAX}
              autoComplete="email"
              inputMode="email"
              aria-required="true"
              aria-invalid={errors.senderEmail ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </Labelled>

        <Labelled
          id={fieldId('subject')}
          label={ui.subject}
          requiredWord={ui.required}
          error={errors.subject}
        >
          {(describedBy) => (
            <Input
              id={fieldId('subject')}
              name="subject"
              value={values.subject}
              onChange={change('subject')}
              maxLength={CONTACT_SUBJECT_MAX}
              autoComplete="off"
              aria-invalid={errors.subject ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </Labelled>

        <Labelled
          id={fieldId('message')}
          label={ui.message}
          required
          requiredWord={ui.required}
          hint={fill(ui.messageHint, {
            min: CONTACT_MESSAGE_MIN,
            max: CONTACT_MESSAGE_MAX,
            links: CONTACT_MAX_LINKS,
          })}
          extra={fill(ui.counter, { count: length, max: CONTACT_MESSAGE_MAX })}
          error={errors.message}
        >
          {(describedBy) => (
            <Textarea
              id={fieldId('message')}
              name="message"
              rows={6}
              value={values.message}
              onChange={change('message')}
              maxLength={CONTACT_MESSAGE_MAX}
              autoComplete="off"
              aria-required="true"
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </Labelled>

        {/* The honeypot: people never see or reach it, bots fill it in. */}
        <div aria-hidden="true" className="sr-only">
          <label>
            {ui.honeypot}
            <input
              type="text"
              name={CONTACT_HONEYPOT_FIELD}
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        {captchaKey && (
          <div>
            <p className="mb-2 text-xs text-muted">{ui.captchaNote}</p>
            <div ref={captchaBox} />
            <noscript>
              <p className="text-sm text-danger">{ui.needsScript}</p>
            </noscript>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" loading={sending}>
            {sending ? ui.sending : ui.send}
          </Button>
          {!page && (
            <Button
              disabled={sending}
              onClick={() => {
                setNotice(null);
                setErrors({});
                setPhase('closed');
              }}
            >
              {ui.cancel}
            </Button>
          )}
        </div>
      </form>

      <p className="mt-4 text-sm text-muted">
        {fill(ui.privacy, { name: form.ownerName, days: form.days })}{' '}
        <Link
          href={form.privacyHref}
          className="text-accent-fg underline underline-offset-2 hover:no-underline"
        >
          {ui.privacyLink}
        </Link>
      </p>
    </div>
  );
}
