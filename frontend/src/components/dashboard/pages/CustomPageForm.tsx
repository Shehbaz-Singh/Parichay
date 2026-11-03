import { useEffect, useRef, useState } from 'react';
import {
  CUSTOM_PAGE_BODY_MAX,
  PAGE_TITLE_MAX,
  customPageSlugSchema,
  type MyCustomPage,
} from '@parichay/shared';
import { ApiError } from '@/lib/client-api';
import { PROBLEMS } from '@/lib/messages';
import { Button, ErrorText, Input, Textarea } from '../../ui';
import { useReportDirty } from '../editor-context';

// The title, address and text of a page the owner made. Plain fields with the shared schema's own
// rules (the address is checked as it is typed). Saved by its button, not by itself: a page's address is
// a link people may share, so it should not change while someone is still deciding on it.
export function CustomPageForm({
  page,
  onSave,
  onCancel,
}: {
  page?: MyCustomPage; // none: a new page
  onSave: (input: { title: string; slug?: string; body: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(page?.title ?? '');
  const [slug, setSlug] = useState(page?.slug ?? '');
  const [body, setBody] = useState(page?.body ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);

  // The person asked for this form, so the keyboard lands in it.
  useEffect(() => first.current?.focus(), []);

  const dirty =
    title !== (page?.title ?? '') || slug !== (page?.slug ?? '') || body !== (page?.body ?? '');
  useReportDirty(dirty);

  const slugProblem = (value: string) => {
    if (!value.trim()) return null;
    const result = customPageSlugSchema.safeParse(value);
    return result.success ? null : (result.error.issues[0]?.message ?? 'Not a valid address');
  };

  async function submit() {
    setError(null);
    if (!title.trim()) return setError('Give the page a name.');
    const problem = slugProblem(slug);
    setSlugError(problem);
    if (problem) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), ...(slug.trim() && { slug: slug.trim() }), body });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SLUG_TAKEN') setSlugError(err.message);
      else setError(err instanceof ApiError ? err.message : PROBLEMS.notSaved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="page-title" className="mb-1 block text-sm font-medium">
          Page name
        </label>
        <Input
          ref={first}
          id="page-title"
          value={title}
          maxLength={PAGE_TITLE_MAX}
          placeholder="e.g. Speaking"
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">
          Shown in your navigation. Up to {PAGE_TITLE_MAX} characters.
        </p>
      </div>
      <div>
        <label htmlFor="page-slug" className="mb-1 block text-sm font-medium">
          Page address
        </label>
        <Input
          id="page-slug"
          value={slug}
          maxLength={30}
          placeholder="made from the name"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={slugError ? true : undefined}
          aria-describedby="page-slug-note"
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugError(slugProblem(e.target.value));
          }}
        />
        <p id="page-slug-note" className="mt-1 text-xs text-muted">
          Lowercase letters, numbers and hyphens: yourname/p/
          <strong>{slug.trim() || 'speaking'}</strong>.
          {page && ' Changing it breaks links people already have to this page.'}
        </p>
        <ErrorText>{slugError ?? undefined}</ErrorText>
      </div>
      <div>
        <label htmlFor="page-body" className="mb-1 block text-sm font-medium">
          Text
        </label>
        <Textarea
          id="page-body"
          rows={6}
          value={body}
          maxLength={CUSTOM_PAGE_BODY_MAX}
          aria-describedby="page-body-note"
          onChange={(e) => setBody(e.target.value)}
        />
        <p id="page-body-note" className="mt-1 text-xs text-muted">
          Optional. Plain text works; you can also use **bold**, *italic*, lists and links. Up to{' '}
          {CUSTOM_PAGE_BODY_MAX} characters. Sections can be put on this page below the text.
        </p>
      </div>
      <ErrorText>{error ?? undefined}</ErrorText>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" loading={saving} onClick={() => void submit()}>
          {saving ? 'Saving…' : 'Save page'}
        </Button>
        <Button variant="ghost" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
