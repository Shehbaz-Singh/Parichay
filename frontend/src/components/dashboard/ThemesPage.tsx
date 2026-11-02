'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { profileUpdateSchema } from '@parichay/shared';
import { normalizeHex } from '@/lib/color';
import { schemaResolver } from '@/lib/form';
import { DEFAULT_THEME, getTheme } from '@/lib/themes';
import { Form } from '../form-fields';
import { AccentPicker } from './AccentPicker';
import { useFormAutosave } from './autosave';
import { useEditor } from './editor-context';
import { ThemePicker } from './ThemePicker';

const schema = profileUpdateSchema.pick({ theme: true, accentColor: true });
type Fields = { theme: string; accentColor: string };

// Choosing a theme or an accent color shows in the preview at once and is saved by itself.
export function ThemesPage() {
  const { profile, saveFields, setDraft } = useEditor();
  const form = useForm<Fields, unknown, z.output<typeof schema>>({
    resolver: schemaResolver(schema),
    defaultValues: { theme: getTheme(profile.theme).key, accentColor: profile.accentColor },
  });

  useEffect(() => {
    // While a hex code is half typed the preview keeps the last complete one.
    let accent = profile.accentColor;
    const publish = (v: Partial<Fields>) => {
      accent = normalizeHex(v.accentColor) ?? accent;
      setDraft({ theme: v.theme ?? DEFAULT_THEME, accentColor: accent });
    };
    publish(form.getValues());
    const subscription = form.watch(publish);
    return () => {
      subscription.unsubscribe();
      setDraft(null);
    };
  }, [form, setDraft, profile.accentColor]);

  async function save(values: z.output<typeof schema>) {
    await saveFields(values);
  }
  useFormAutosave(form, save);

  return (
    <section aria-label="Pick a look" className="space-y-4">
      <p className="text-sm text-muted">
        Try a few. Your words stay the same, and the preview shows each one with your own details.
      </p>
      <Form form={form} onSubmit={save}>
        <ThemePicker />
        <AccentPicker />
      </Form>
    </section>
  );
}
