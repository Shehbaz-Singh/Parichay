'use client';

import { useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { ChevronDown, Trash2, Undo2 } from 'lucide-react';
import type { Section } from '@parichay/shared';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, EmptyState } from '../ui';
import { cx } from '../ui/cx';
import {
  useEditor,
  useSection,
  useSuggestions,
  type SectionItem,
  type SuggestionMap,
} from './editor-context';
import { useLeaveGuard } from './navigation';
import { SortableList } from './SortableList';

// Every list except skills (which are single words and have their own quick-add) can receive
// suggestions from a resume.
type ListSection = Exclude<Section, 'skills'>;
type Draft<S extends ListSection> = SuggestionMap[S];

// T is a saved item and D what a suggestion looks like (nothing, for lists without suggestions).
export interface FormProps<T, D = never> {
  item?: T; // set when editing a saved item
  draft?: D; // set when reviewing a suggestion from a resume
  onDone: () => void; // close the form (saved or cancelled)
  onSaved?: () => void; // called after a successful save, before onDone
}
export type ItemFormProps<S extends ListSection> = FormProps<SectionItem<S>, Draft<S>>;

interface ListApi<T> {
  items: T[];
  create: (input: unknown) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => void | Promise<void>;
}

interface Suggestions<D> {
  suggestions: { key: string; data: D }[];
  dismiss: (key: string) => void;
  dismissAll: () => void;
}

interface ListProps<T extends { id: string }, D> {
  list: ListApi<T>;
  suggestions?: Suggestions<D>;
  noun: string; // "job", used in messages
  addLabel: string;
  empty: string; // what the empty list says: what is missing and why it is worth adding
  icon?: LucideIcon; // drawn above it
  limit?: number; // most items allowed; the Add button is replaced by a note when it is reached
  summary: (item: T | D) => { title: string; subtitle?: string };
  Form: ComponentType<FormProps<T, D>>;
  extra?: (item: T) => ReactNode; // extra controls in a row (link visibility)
  jumpKind?: string; // the name the command palette uses for this list's items
}

// How long a deleted item can be brought back before the delete is sent.
const UNDO_MS = 6000;

const noSuggestions = { suggestions: [], dismiss: () => {}, dismissAll: () => {} };

// One list in the editor: collapsible cards (the title and a summary, open one to edit it), an Add
// button, and drag-to-reorder. Delete is immediate but can be undone for a few seconds: the item
// is only removed on the server once the time is up (or when you leave the page). Entries read from
// a resume appear above it as suggestions that can be edited and added, or skipped. The create/edit
// form is passed in, so every list shares this shell.
export function ListManager<T extends { id: string }, D = never>({
  list,
  suggestions: suggestionApi = noSuggestions,
  noun,
  addLabel,
  empty,
  icon,
  limit,
  summary,
  Form,
  extra,
  jumpKind,
}: ListProps<T, D>) {
  const { items, create, remove, reorder } = list;
  const { suggestions, dismiss, dismissAll } = suggestionApi;
  const { attempt, jump, clearJump } = useEditor();
  const canLeave = useLeaveGuard();
  const panelBase = useId();
  // An item id, "new", "s:<suggestion key>", or nothing. One form at a time keeps unsaved
  // edits from being lost.
  const [editing, setEditing] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]); // waiting out the undo time
  const [adding, setAdding] = useState(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const removeRef = useRef(remove);
  const focusNext = useRef<string | null>(null); // a selector to focus after the next render
  const root = useRef<HTMLDivElement>(null);
  const sortable = items.length > 1;
  const full = limit !== undefined && items.length >= limit;
  const showEmpty = items.length === 0 && editing !== 'new' && suggestions.length === 0;
  const close = () => setEditing(null);
  const summarize = (item: T | D) => summary(item);

  useEffect(() => {
    removeRef.current = remove;
  });
  // The command palette asked for one of these items: open its editor, and bring it into view.
  useEffect(() => {
    if (!jumpKind || jump?.kind !== jumpKind || !items.some((item) => item.id === jump.id)) return;
    setEditing(jump.id);
    clearJump();
    focusNext.current = `[data-toggle="${jump.id}"]`;
  }, [jump, jumpKind, items, clearJump]);
  useEffect(() => {
    if (!focusNext.current) return;
    root.current?.querySelector<HTMLElement>(focusNext.current)?.focus();
    focusNext.current = null;
  });

  async function commitDelete(id: string) {
    timers.current.delete(id);
    await attempt(() => removeRef.current(id));
    setDeleted((ids) => ids.filter((x) => x !== id));
  }

  function onDelete(id: string) {
    if (editing === id) close();
    focusNext.current = `[data-undo="${id}"]`;
    setDeleted((ids) => [...ids, id]);
    timers.current.set(
      id,
      setTimeout(() => void commitDelete(id), UNDO_MS),
    );
  }

  function undo(id: string) {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    focusNext.current = `[data-toggle="${id}"]`;
    setDeleted((ids) => ids.filter((x) => x !== id));
  }

  // Leaving the page does not cancel a delete that is waiting: it is sent now.
  useEffect(() => {
    const waiting = timers.current;
    return () => {
      for (const [id, timer] of waiting) {
        clearTimeout(timer);
        void commitDelete(id);
      }
    };
  }, []);

  // Opens a card (or closes it), asking first when the open form has edits that would be lost.
  async function toggle(id: string) {
    if (editing !== null && !(await canLeave())) return;
    setEditing(editing === id ? null : id);
  }

  // Adds suggestions as they are, one after another so their order is kept. Stops at the
  // first failure; whatever was added is already gone from the list.
  async function addSuggestions(chosen: typeof suggestions) {
    setAdding(true);
    await attempt(async () => {
      for (const suggestion of chosen) {
        await create(suggestion.data);
        dismiss(suggestion.key);
      }
    });
    setAdding(false);
  }

  function row(item: T, handle?: ReactNode) {
    const { title, subtitle } = summarize(item);
    if (deleted.includes(item.id)) {
      return (
        <Card padding="sm" dashed className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm">
            Deleted <span className="font-medium">{title}</span>.
          </p>
          <Button
            data-undo={item.id}
            onClick={() => undo(item.id)}
            aria-label={`Undo delete ${title}`}
          >
            <Undo2 aria-hidden="true" className="size-4" />
            Undo
          </Button>
        </Card>
      );
    }
    const open = editing === item.id;
    const panelId = `${panelBase}-${item.id}`;
    return (
      <Card padding="sm" tone={open ? 'accent' : 'default'} className="space-y-3">
        <div className="flex items-center gap-2">
          {!open && handle}
          <button
            type="button"
            data-toggle={item.id}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            disabled={adding}
            onClick={() => void toggle(item.id)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-control p-1 text-start hover:bg-surface"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{title}</span>
              {subtitle && <span className="block text-sm text-muted">{subtitle}</span>}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cx(
                'size-5 shrink-0 text-muted transition-transform',
                open && 'rotate-180',
              )}
            />
          </button>
          {extra?.(item)}
          <Button variant="danger" onClick={() => onDelete(item.id)} aria-label={`Delete ${title}`}>
            <Trash2 aria-hidden="true" className="size-4" />
            <span className="max-sm:sr-only">Delete</span>
          </Button>
        </div>
        {open && (
          <div id={panelId}>
            <Form item={item} onDone={close} />
          </div>
        )}
      </Card>
    );
  }

  return (
    <div ref={root} className="space-y-3">
      {suggestions.length > 0 && (
        <Card
          as="section"
          tone="tint"
          dashed
          padding="sm"
          aria-label={`${noun} suggestions from your resume`}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">From your resume ({suggestions.length})</p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                disabled={adding || editing !== null}
                onClick={() => addSuggestions(suggestions)}
              >
                {adding ? 'Adding…' : 'Add all'}
              </Button>
              <Button variant="ghost" disabled={adding} onClick={dismissAll}>
                Dismiss all
              </Button>
            </div>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion) => {
              const { title, subtitle } = summarize(suggestion.data);
              if (editing === `s:${suggestion.key}`) {
                return (
                  <Card as="li" key={suggestion.key} tone="accent">
                    <Form
                      draft={suggestion.data}
                      onDone={close}
                      onSaved={() => dismiss(suggestion.key)}
                    />
                  </Card>
                );
              }
              return (
                <Card
                  as="li"
                  key={suggestion.key}
                  padding="sm"
                  className="flex items-center gap-2 bg-page"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{title}</p>
                    {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                  </div>
                  <Button
                    disabled={adding || editing !== null}
                    onClick={() => setEditing(`s:${suggestion.key}`)}
                    aria-label={`Review and add ${title}`}
                  >
                    Review
                  </Button>
                  <Button
                    variant="primary"
                    disabled={adding || editing !== null}
                    onClick={() => addSuggestions([suggestion])}
                    aria-label={`Add ${title}`}
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={adding}
                    onClick={() => dismiss(suggestion.key)}
                    aria-label={`Skip ${title}`}
                  >
                    Skip
                  </Button>
                </Card>
              );
            })}
          </ul>
        </Card>
      )}

      {showEmpty && (
        <Card dashed padding="lg" className="text-center">
          <EmptyState
            icon={icon}
            action={
              <Button variant="primary" onClick={() => setEditing('new')}>
                Add your first {noun}
              </Button>
            }
          >
            {empty}
          </EmptyState>
        </Card>
      )}

      {sortable ? (
        <SortableList
          items={items}
          onReorder={reorder}
          label={(item) => summarize(item).title}
          renderItem={(item, handle) => row(item, handle)}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>{row(item)}</li>
          ))}
        </ul>
      )}

      {editing === 'new' ? (
        <Card tone="accent">
          <Form onDone={close} />
        </Card>
      ) : showEmpty ? null : full ? (
        <p className="text-sm text-muted">
          That’s the most {noun}s you can have here ({limit}). Delete one if you’d like to add
          another.
        </p>
      ) : (
        <Button variant="primary" disabled={editing !== null} onClick={() => setEditing('new')}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

type SectionManagerProps<S extends ListSection> = { section: S } & Omit<
  ListProps<SectionItem<S>, Draft<S>>,
  'list' | 'suggestions' | 'limit'
>;

// ListManager for one of the built-in lists: its items, plus any suggestions from a resume.
export function SectionManager<S extends ListSection>({
  section,
  ...props
}: SectionManagerProps<S>) {
  const list = useSection(section);
  const suggestions = useSuggestions(section);
  return <ListManager list={list} suggestions={suggestions} jumpKind={section} {...props} />;
}
