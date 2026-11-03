'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { skillInputSchema, type SkillInput } from '@parichay/shared';
import { schemaResolver, showApiError } from '@/lib/form';
import { Button, Card, EmptyState, ErrorText, Input, SlowNotice } from '../../ui';
import { useEditor, useSection, useSuggestions, type Suggestion } from '../editor-context';
import { SortableList } from '../SortableList';
import { NOTICES } from '@/lib/messages';

export function SkillsStep() {
  const { items, create, remove, reorder } = useSection('skills');
  const { notify, attempt } = useEditor();
  const { suggestions, dismiss, dismissAll } = useSuggestions('skills');
  const [adding, setAdding] = useState(false);
  const form = useForm<{ name: string }, unknown, SkillInput>({
    resolver: schemaResolver(skillInputSchema),
    defaultValues: { name: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const skillError = errors.name?.message ?? errors.root?.server?.message;

  // Skills are single words, so adding is one field and Enter, not a form per skill.
  const add = form.handleSubmit(async (values) => {
    try {
      await create(values);
      form.reset();
      notify('success', NOTICES.skillAdded(values.name));
    } catch (err) {
      showApiError(form, err);
    }
  });

  // Adds suggested skills one after another so their order is kept; each leaves the list once added.
  async function addSuggested(list: Suggestion<'skills'>[]) {
    setAdding(true);
    await attempt(async () => {
      for (const suggestion of list) {
        await create({ name: suggestion.data });
        dismiss(suggestion.key);
      }
    });
    setAdding(false);
  }

  return (
    <section aria-labelledby="skills-heading" className="space-y-4">
      <div>
        <h2 id="skills-heading" className="type-section">
          Skills
        </h2>
        <p className="text-sm text-muted">
          Drag the grip to reorder, or focus it and use the arrow keys.
        </p>
      </div>

      <form onSubmit={add} noValidate className="flex gap-2">
        <Input
          aria-label="New skill"
          placeholder="e.g. Figma, TypeScript, Public speaking"
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={skillError ? 'skill-error' : undefined}
          {...form.register('name')}
        />
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Add
        </Button>
      </form>
      <ErrorText id="skill-error">{skillError}</ErrorText>
      <SlowNotice pending={isSubmitting} />

      {suggestions.length > 0 && (
        <Card
          as="section"
          tone="tint"
          dashed
          padding="sm"
          aria-label="Skill suggestions from your resume"
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">From your resume ({suggestions.length})</p>
            <div className="flex gap-2">
              <Button variant="primary" disabled={adding} onClick={() => addSuggested(suggestions)}>
                {adding ? 'Adding…' : 'Add all'}
              </Button>
              <Button variant="ghost" disabled={adding} onClick={dismissAll}>
                Dismiss all
              </Button>
            </div>
          </div>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.key}
                className="inline-flex items-center rounded-full border border-line bg-page text-sm"
              >
                <button
                  type="button"
                  aria-label={`Add ${suggestion.data}`}
                  disabled={adding}
                  className="rounded-l-full py-1 pr-2 pl-3 hover:bg-surface disabled:opacity-60"
                  onClick={() => addSuggested([suggestion])}
                >
                  + {suggestion.data}
                </button>
                <button
                  type="button"
                  aria-label={`Skip ${suggestion.data}`}
                  disabled={adding}
                  className="rounded-r-full px-2 py-1 text-muted hover:bg-surface disabled:opacity-60"
                  onClick={() => dismiss(suggestion.key)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {items.length === 0 ? (
        <Card dashed padding="lg" className="text-center">
          <EmptyState icon={Sparkles}>
            Nothing here yet. Type a skill above and press Add. A handful of your strongest beats a
            long list.
          </EmptyState>
        </Card>
      ) : (
        <SortableList
          items={items}
          layout="wrap"
          onReorder={reorder}
          label={(skill) => skill.name}
          renderItem={(skill, handle) => (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-1.5 text-sm">
              {handle}
              {skill.name}
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                className="min-h-6 min-w-6 rounded-full px-2 text-muted hover:bg-line hover:text-danger"
                onClick={() =>
                  void attempt(() => remove(skill.id), NOTICES.skillRemoved(skill.name))
                }
              >
                ×
              </button>
            </span>
          )}
        />
      )}
    </section>
  );
}
