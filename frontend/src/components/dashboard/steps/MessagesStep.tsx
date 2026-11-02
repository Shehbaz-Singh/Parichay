'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Mail, ShieldAlert } from 'lucide-react';
import {
  CONTACT_DEFAULT_RETENTION_DAYS,
  type ContactList,
  type ContactMessage,
  type ContactStatus,
} from '@parichay/shared';
import { ApiError, api } from '@/lib/client-api';
import { fullDate, relativeTime } from '@/lib/relative-time';
import { CONFIRMS, NOTICES, PROBLEMS } from '@/lib/messages';
import { Badge, Button, Card, EmptyState, Tabs, buttonStyles, useConfirm } from '../../ui';
import { ContentSkeleton, LoadFailed } from '../screens';
import { errorText, useEditor } from '../editor-context';
import { Collapsible } from '../layout';
import { useMessages } from '../messages-context';
import { ContactFormCard } from './ContactFormCard';

type Filter = 'all' | ContactStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'read', label: 'Read' },
  { id: 'archived', label: 'Archived' },
];

// The text of a mailto: link: the reply goes out from the owner's own email app, nothing is sent
// through Parichay.
const replyHref = (message: ContactMessage) => {
  const subject = message.subject ? `Re: ${message.subject}` : 'Re: your message';
  return `mailto:${message.senderEmail}?subject=${encodeURIComponent(subject)}`;
};

// ---- one message

function MessageDetail({
  id,
  onBack,
  onChanged,
}: {
  id: string;
  onBack: () => void;
  onChanged: () => void; // something about the list changed (status, deleted)
}) {
  const { notify } = useEditor();
  const { refresh } = useMessages();
  const confirm = useConfirm();
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const loadedId = message?.id;

  // Opening a new message reads it: it moves from New to Read, and Mark as unread undoes that.
  useEffect(() => {
    const controller = new AbortController();
    setMessage(null);
    setFailed(null);
    (async () => {
      try {
        let found = await api<ContactMessage>(`/profile/me/messages/${id}`, {
          signal: controller.signal,
        });
        if (found.status === 'new') {
          found = await api<ContactMessage>(`/profile/me/messages/${id}`, {
            method: 'PATCH',
            body: { status: 'read' },
            signal: controller.signal,
          });
          onChanged();
          void refresh();
        }
        setMessage(found);
      } catch (err) {
        if (!controller.signal.aborted) setFailed(err);
      }
    })();
    return () => controller.abort();
    // Both callbacks are stable, so the message is fetched once per id (and per retry).
  }, [id, attempt, onChanged, refresh]);

  useEffect(() => {
    if (message) heading.current?.focus();
  }, [loadedId]);

  async function setStatus(status: ContactStatus, success: string) {
    setBusy(true);
    try {
      setMessage(
        await api<ContactMessage>(`/profile/me/messages/${id}`, {
          method: 'PATCH',
          body: { status },
        }),
      );
      notify('success', success);
      onChanged();
      void refresh();
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(spam: boolean) {
    if (!message) return;
    const sure = await confirm({
      title: spam ? 'Report this message as spam?' : 'Delete this message?',
      message: spam
        ? CONFIRMS.reportSpam(message.senderName)
        : CONFIRMS.deleteMessage(message.senderName),
      confirmLabel: spam ? 'Report and delete' : 'Delete',
      danger: true,
    });
    if (!sure) return;
    setBusy(true);
    try {
      await api(`/profile/me/messages/${id}`, { method: 'DELETE' });
      notify('success', spam ? NOTICES.messageSpam : NOTICES.messageDeleted);
      onChanged();
      void refresh();
      onBack();
    } catch (err) {
      notify('error', errorText(err));
      setBusy(false);
    }
  }

  async function copyEmail() {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message.senderEmail);
      setCopied(true);
      notify('success', NOTICES.emailCopied(message.senderEmail));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('error', PROBLEMS.copyEmail);
    }
  }

  const back = (
    <Button variant="ghost" onClick={onBack} className="-ms-2">
      <ArrowLeft aria-hidden="true" className="size-4" />
      Back to messages
    </Button>
  );

  if (failed) {
    const gone = failed instanceof ApiError && failed.status === 404;
    return (
      <div className="space-y-4">
        {back}
        {gone ? (
          <EmptyState>This message is no longer here. It may have been deleted.</EmptyState>
        ) : (
          <LoadFailed
            title="We couldn’t open this message"
            error={failed}
            retry={() => setAttempt((n) => n + 1)}
          />
        )}
      </div>
    );
  }
  if (!message) return <ContentSkeleton label="Opening the message…" />;

  return (
    <article aria-labelledby="message-heading" className="space-y-4">
      {back}
      <Card className="space-y-4">
        <header className="space-y-1">
          <h3
            id="message-heading"
            ref={heading}
            tabIndex={-1}
            className="type-subsection break-words focus:outline-none"
          >
            {message.subject ?? 'No subject'}
          </h3>
          <p className="text-sm">
            From <span className="font-medium">{message.senderName}</span>{' '}
            <a
              href={`mailto:${message.senderEmail}`}
              className="break-all text-accent-fg underline underline-offset-2"
            >
              {message.senderEmail}
            </a>
          </p>
          <p className="text-sm text-muted">
            <time dateTime={message.createdAt}>{fullDate(message.createdAt)}</time>
            {message.status === 'archived' && ' · Archived'}
            {message.status === 'new' && ' · Unread'}
          </p>
        </header>
        <p className="break-words whitespace-pre-wrap">{message.message}</p>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <a href={replyHref(message)} className={buttonStyles({ variant: 'primary' })}>
            <Mail aria-hidden="true" className="size-4" />
            Reply by email
          </a>
          <Button onClick={copyEmail}>
            {copied ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            Copy sender’s email
          </Button>
          {message.status === 'new' ? (
            <Button disabled={busy} onClick={() => setStatus('read', NOTICES.messageMarkedRead)}>
              Mark as read
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => setStatus('new', NOTICES.messageMarkedUnread)}>
              Mark as unread
            </Button>
          )}
          {message.status === 'archived' ? (
            <Button disabled={busy} onClick={() => setStatus('read', NOTICES.messageMovedBack)}>
              Move back to inbox
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => setStatus('archived', NOTICES.messageArchived)}>
              Archive
            </Button>
          )}
          <Button variant="danger" disabled={busy} onClick={() => remove(false)}>
            Delete
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => remove(true)}>
            <ShieldAlert aria-hidden="true" className="size-4" />
            Report as spam
          </Button>
        </div>
        <p className="text-xs text-muted">
          Replying opens your own email app with the subject filled in. Nothing is sent through
          Parichay, and the sender is not told you read the message.
        </p>
      </Card>
    </article>
  );
}

// ---- the list

function MessageRow({
  item,
  now,
  onOpen,
}: {
  item: ContactList['items'][number];
  now: number;
  onOpen: () => void;
}) {
  const unread = item.status === 'new';
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-card border border-line p-3 text-start transition hover:bg-surface active:bg-line"
      >
        <span
          aria-hidden="true"
          className={`mt-2 size-2.5 shrink-0 rounded-full ${unread ? 'bg-accent' : 'bg-transparent'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className={`truncate ${unread ? 'font-semibold' : 'font-medium'}`}>
              {item.senderName}
              {unread && <span className="sr-only"> (unread)</span>}
            </span>
            <time
              dateTime={item.createdAt}
              title={fullDate(item.createdAt)}
              className="shrink-0 text-xs text-muted"
            >
              {relativeTime(item.createdAt, now)}
            </time>
          </span>
          <span className="block truncate text-sm">{item.subject ?? item.snippet}</span>
          {item.subject && (
            <span className="block truncate text-sm text-muted">{item.snippet}</span>
          )}
          {item.status === 'archived' && <Badge className="mt-1">Archived</Badge>}
        </span>
      </button>
    </li>
  );
}

function Inbox({ onRetention }: { onRetention: (days: number) => void }) {
  const { unread, setUnread } = useMessages();
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [data, setData] = useState<ContactList | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page) });
    if (filter !== 'all') query.set('status', filter);
    api<ContactList>(`/profile/me/messages?${query}`, { signal: controller.signal }).then(
      (list) => {
        // A page that no longer exists (the last message of it was deleted) steps back.
        if (list.items.length === 0 && list.page > 1) return setPage(list.page - 1);
        setData(list);
        setError(null);
        setUnread(list.counts.new);
        onRetention(list.retentionDays);
      },
      (err) => {
        if (!controller.signal.aborted) setError(err);
      },
    );
    return () => controller.abort();
  }, [filter, page, attempt, setUnread, onRetention]);

  const back = () => {
    setOpenId(null);
    // The list heading takes focus once the list is drawn again.
    setTimeout(() => listHeading.current?.focus(), 0);
  };

  if (openId) return <MessageDetail id={openId} onBack={back} onChanged={reload} />;

  if (error && !data) {
    return <LoadFailed title="We couldn’t load your messages" error={error} retry={reload} />;
  }
  if (!data) return <ContentSkeleton label="Loading your messages…" />;

  const now = Date.now();
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const count = (id: Filter) => (id === 'all' ? undefined : data.counts[id]);

  return (
    <div className="space-y-4">
      <div>
        <h3
          ref={listHeading}
          tabIndex={-1}
          className="type-subsection flex items-center gap-2 focus:outline-none"
        >
          Inbox
          {unread > 0 && (
            <Badge tone="solid">
              {unread}
              <span className="sr-only"> unread</span>
            </Badge>
          )}
        </h3>
        <p className="text-sm text-muted">
          Newest first. Messages are deleted automatically after {data.retentionDays} days.
        </p>
      </div>

      <Tabs
        label="Show messages"
        idBase="messages-filter"
        value={filter}
        onChange={(id) => {
          setFilter(id as Filter);
          setPage(1);
        }}
        tabs={FILTERS.map(({ id, label }) => ({
          id,
          label,
          count: count(id) ? count(id) : undefined,
          countLabel: id === 'new' ? 'unread' : undefined,
        }))}
      >
        {data.items.length === 0 ? (
          <EmptyState>
            {filter === 'all'
              ? 'No messages yet. When someone writes to you from your page, it shows up here.'
              : `No ${filter === 'new' ? 'new' : filter} messages.`}
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item) => (
              <MessageRow key={item.id} item={item} now={now} onOpen={() => setOpenId(item.id)} />
            ))}
          </ul>
        )}
      </Tabs>

      {pages > 1 && (
        <nav aria-label="Pages of messages" className="flex items-center justify-between gap-3">
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <p className="text-sm text-muted" aria-live="polite">
            Page {data.page} of {pages}
          </p>
          <Button disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}

// ---- the step

export function MessagesStep() {
  // The exact retention comes with the list; the settings card shows it as soon as it is known.
  const [days, setDays] = useState(CONTACT_DEFAULT_RETENTION_DAYS);
  const { profile } = useEditor();

  return (
    <section aria-label="Messages" className="space-y-6">
      <p className="text-sm text-muted">Replies go from your own email app.</p>
      <Inbox onRetention={setDays} />
      <Collapsible
        title="Contact form settings"
        description="Switch the form on or off, and choose how long messages are kept."
        defaultOpen={!profile.contactFormEnabled}
      >
        <ContactFormCard retentionDays={days} />
      </Collapsible>
    </section>
  );
}
