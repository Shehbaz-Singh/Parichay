'use client';

import { useCallback, useId, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  LANGUAGES,
  MAX_EXTRA_LANGUAGES,
  languageOf,
  type Language,
  type MyLanguages,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { useLoad } from '@/lib/hooks';
import { Button, Card, ErrorText, Input, Modal, Select } from '../../ui';
import { errorText, useEditor } from '../editor-context';
import { InfoToggle } from '../layout';
import { LanguageProgress } from '../languages/LanguageProgress';
import { TranslationEditor } from '../languages/TranslationEditor';
import { ContentSkeleton, LoadFailed } from '../screens';
import { NOTICES } from '@/lib/messages';

const loadLanguages = (signal: AbortSignal) =>
  api<MyLanguages>('/profile/me/languages', { signal });

// A language name with its own-script name next to it, which carries its own lang and direction.
function LanguageName({ language, className }: { language: Language; className?: string }) {
  return (
    <span className={className}>
      {language.name}
      {language.nativeName !== language.name && (
        <>
          {' '}
          <span lang={language.code} dir={language.dir} className="text-muted">
            ({language.nativeName})
          </span>
        </>
      )}
    </span>
  );
}

// Languages: the main one, the extra ones the page is offered in, and the editor for their texts.
export function LanguagesStep() {
  const { state, retry } = useLoad(loadLanguages);
  const [fresh, setFresh] = useState<MyLanguages | null>(null);
  const data = fresh ?? (state.status === 'ready' ? state.data : null);

  const refresh = useCallback(async () => {
    try {
      setFresh(await api<MyLanguages>('/profile/me/languages'));
    } catch {
      // The figures stay as they were; the next change refreshes them.
    }
  }, []);

  if (!data) {
    if (state.status === 'error') {
      return (
        <LoadFailed title="We couldn’t load your languages" error={state.error} retry={retry} />
      );
    }
    return <ContentSkeleton label="Loading your languages…" />;
  }

  return (
    <div className="space-y-10">
      <MainLanguage languages={data} onChange={setFresh} />
      <OtherLanguages languages={data} onChange={setFresh} />
      <section aria-labelledby="translate-heading" className="space-y-4">
        <h2 id="translate-heading" className="type-section">
          Translate your texts
        </h2>
        <InfoToggle label="How translating works">
          Each text shows your original beside the translation. Anything you leave empty appears in
          your main language, so a page is never half blank. Changes are saved by themselves, and
          the preview can show the language you are working on.
        </InfoToggle>
        <TranslationEditor languages={data} refresh={refresh} />
      </section>
    </div>
  );
}

// After any change to the languages the profile holds the new list too, so the preview, the
// switcher and the translation editor all agree.
function useApplyLanguages(onChange: (next: MyLanguages) => void) {
  const { update, dropTranslations, previewLocale, setPreviewLocale } = useEditor();
  return useCallback(
    (next: MyLanguages, removed?: string) => {
      update((p) => ({
        ...p,
        defaultLocale: next.defaultLocale,
        locales: next.languages.map((l) => l.locale),
      }));
      if (removed) dropTranslations(removed);
      if (removed === previewLocale) setPreviewLocale(next.defaultLocale);
      onChange(next);
    },
    [update, dropTranslations, previewLocale, setPreviewLocale, onChange],
  );
}

function MainLanguage({
  languages,
  onChange,
}: {
  languages: MyLanguages;
  onChange: (next: MyLanguages) => void;
}) {
  const { notify } = useEditor();
  const apply = useApplyLanguages(onChange);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const locked = languages.languages.length > 0;
  const current = languageOf(languages.defaultLocale);

  async function change(code: string) {
    if (code === languages.defaultLocale) return;
    setBusy(true);
    setError('');
    try {
      const next = await api<MyLanguages>('/profile/me/languages', {
        method: 'PUT',
        body: { defaultLocale: code },
      });
      apply(next);
      notify('success', NOTICES.mainLanguage(languageOf(code).name));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={`${id}-h`} className="space-y-3">
      <h2 id={`${id}-h`} className="type-section">
        Main language
      </h2>
      <p className="text-sm text-muted">
        The language your page is written in. Visitors see it unless they pick another language.
      </p>
      <div className="max-w-xs">
        <label htmlFor={`${id}-select`} className="mb-1 block text-sm font-medium">
          Language your texts are written in
        </label>
        <Select
          id={`${id}-select`}
          value={languages.defaultLocale}
          disabled={locked || busy}
          aria-describedby={`${id}-help`}
          onChange={(code) => void change(code)}
          options={LANGUAGES.map((l) => ({
            value: l.code,
            label: l.nativeName === l.name ? l.name : `${l.name} (${l.nativeName})`,
          }))}
        />
      </div>
      <p id={`${id}-help`} className="text-sm text-muted">
        {locked ? (
          <>
            You can change the main language only while you have no other languages. Remove the
            languages below first, and note that their translations are deleted with them.
          </>
        ) : (
          <>
            Your texts are currently written in <LanguageName language={current} />. Changing this
            does not translate anything. It only says which language they are in.
          </>
        )}
      </p>
      <div role="status" aria-live="polite" className="sr-only">
        {busy ? 'Saving the main language' : ''}
      </div>
      <ErrorText>{error}</ErrorText>
    </section>
  );
}

function OtherLanguages({
  languages,
  onChange,
}: {
  languages: MyLanguages;
  onChange: (next: MyLanguages) => void;
}) {
  const { notify, setPreviewLocale } = useEditor();
  const apply = useApplyLanguages(onChange);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const used = new Set([languages.defaultLocale, ...languages.languages.map((l) => l.locale)]);
  const candidates = LANGUAGES.filter((l) => !used.has(l.code));
  const full = languages.languages.length >= languages.maxExtra;

  async function add(code: string) {
    setAdding(code);
    setError('');
    try {
      const next = await api<MyLanguages>('/profile/me/languages', {
        method: 'POST',
        body: { locale: code },
      });
      apply(next);
      setPreviewLocale(code);
      const message = NOTICES.languageAdded(languageOf(code).name);
      setAnnouncement(message);
      notify('success', message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setAdding(null);
    }
  }

  return (
    <section aria-labelledby="other-languages-heading" className="space-y-4">
      <h2 id="other-languages-heading" className="type-section">
        Other languages
      </h2>
      <p className="text-sm text-muted">
        Offer your page in up to {MAX_EXTRA_LANGUAGES} more languages. A language is shown to
        visitors once its tagline and about are translated. You have added{' '}
        {languages.languages.length} of {languages.maxExtra}.
      </p>

      {languages.languages.length === 0 ? (
        <p className="text-sm text-muted">You have not added a language yet.</p>
      ) : (
        <ul className="space-y-3">
          {languages.languages.map((status) => {
            const language = languageOf(status.locale);
            return (
              <li key={status.locale}>
                <Card padding="sm" className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-medium">
                      <LanguageName language={language} />
                    </h3>
                    <Button size="sm" variant="danger" onClick={() => setRemoving(status.locale)}>
                      Remove<span className="sr-only"> {language.name}</span>
                    </Button>
                  </div>
                  <LanguageProgress status={status} />
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <fieldset className="space-y-2" disabled={full || adding !== null}>
        <legend className="text-sm font-medium">Add a language</legend>
        {full ? (
          <p className="text-sm text-muted">
            You have reached the limit of {languages.maxExtra} extra languages. Remove one to add
            another.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {candidates.map((language) => (
              <li key={language.code}>
                <Button onClick={() => void add(language.code)} loading={adding === language.code}>
                  <Plus aria-hidden="true" className="size-4" />
                  <LanguageName language={language} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <ErrorText>{error}</ErrorText>

      {removing && (
        <RemoveDialog
          code={removing}
          onClose={() => setRemoving(null)}
          onRemoved={(next) => {
            apply(next, removing);
            const message = NOTICES.languageRemoved(languageOf(removing).name);
            setAnnouncement(message);
            notify('success', message);
            setRemoving(null);
          }}
        />
      )}
    </section>
  );
}

// Deleting a language deletes its translations for good, so the owner types its code to confirm.
function RemoveDialog({
  code,
  onClose,
  onRemoved,
}: {
  code: string;
  onClose: () => void;
  onRemoved: (next: MyLanguages) => void;
}) {
  const language = languageOf(code);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const matches = typed.trim().toLowerCase() === code;

  async function remove() {
    setBusy(true);
    setError('');
    try {
      onRemoved(
        await api<MyLanguages>(
          `/profile/me/languages/${code}?confirm=${encodeURIComponent(code)}`,
          {
            method: 'DELETE',
          },
        ),
      );
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={`Remove ${language.name}?`}
      description={
        <>
          The texts you translated into {language.name} are deleted for good, and visitors can no
          longer open your page in it. Your main-language texts are not touched. You can add the
          language again later, but you would start from empty texts.
        </>
      }
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!matches} loading={busy} onClick={() => void remove()}>
            {busy ? 'Removing…' : `Delete ${language.name} and its texts`}
          </Button>
        </>
      }
    >
      <div>
        <label htmlFor={`${id}-confirm`} className="mb-1 block text-sm font-medium">
          Type <strong>{code}</strong> to confirm
        </label>
        <Input
          id={`${id}-confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      <ErrorText id={`${id}-error`}>{error}</ErrorText>
    </Modal>
  );
}
