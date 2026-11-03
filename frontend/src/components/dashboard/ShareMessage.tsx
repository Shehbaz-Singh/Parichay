'use client';

import { useId, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { SHARE_MESSAGE_MAX, SHARE_URL_TOKEN, composeShare } from '@parichay/shared';
import { uiFor } from '@/lib/i18n';
import { NOTICES } from '@/lib/messages';
import { Button, Modal, Textarea } from '../ui';
import { cx } from '../ui/cx';
import { useEditor } from './editor-context';

const DEFAULT_MESSAGE = uiFor('en').share.defaultMessage;

// The suggested message that comes with a share. It sits next to the Share button: the owner edits
// it here, and sees what people will be sent.
export function ShareMessageButton({ url }: { url: string }) {
  const { profile, saveFields, attempt } = useEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const fieldId = useId();
  const hintId = useId();

  const saved = profile.shareMessage ?? DEFAULT_MESSAGE;
  const length = draft.length;
  const near = length >= SHARE_MESSAGE_MAX - 20;
  const preview = composeShare(draft, DEFAULT_MESSAGE, url).withUrl;
  const hasToken = draft.toLowerCase().includes(SHARE_URL_TOKEN);

  function show() {
    setDraft(saved);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    // The default is stored as nothing, so each language keeps using its own default wording.
    const text = draft.trim();
    const ok = await attempt(
      () => saveFields({ shareMessage: !text || text === DEFAULT_MESSAGE ? null : text }),
      NOTICES.shareMessageSaved,
    );
    if (ok) setOpen(false);
    setSaving(false);
  }

  return (
    <>
      <Button size="sm" onClick={show}>
        <MessageSquareText aria-hidden="true" className="size-4" />
        Share message
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Share message"
        description="The text that goes with your link when you or a visitor shares your page."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor={fieldId} className="mb-1 block text-sm font-medium">
              Message
            </label>
            <Textarea
              id={fieldId}
              rows={3}
              maxLength={SHARE_MESSAGE_MAX}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-describedby={hintId}
            />
            <p id={hintId} className="mt-1 flex justify-between gap-3 text-xs text-muted">
              <span>
                Plain text. Put {SHARE_URL_TOKEN} where the link should go
                {hasToken ? '' : '; without it, the link is added at the end'}. Don’t add contact
                details: this text is public.
              </span>
              <span className={cx('shrink-0 tabular-nums', near && 'font-medium text-danger')}>
                {length}/{SHARE_MESSAGE_MAX}
                <span className="sr-only"> characters</span>
              </span>
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">What people will be sent</p>
            <p className="rounded-control bg-surface px-3 py-2 text-sm break-words whitespace-pre-wrap">
              {preview}
            </p>
            <p className="mt-1 text-xs text-muted">
              LinkedIn only takes the link, so it shows the link without the message, with a button
              to copy the message. To write it in another language, open Languages.
            </p>
          </div>

          <Button size="sm" onClick={() => setDraft(DEFAULT_MESSAGE)}>
            Reset to the default
          </Button>
        </div>
      </Modal>
    </>
  );
}
