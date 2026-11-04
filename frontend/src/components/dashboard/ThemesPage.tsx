'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { profileUpdateSchema } from '@parichay/shared';
import { normalizeHex } from '@/lib/color';
import { schemaResolver } from '@/lib/form';
import { DEFAULT_THEME, getTheme } from '@/lib/themes';
import { Form, SelectField } from '../form-fields';
import { AccentPicker } from './AccentPicker';
import { useFormAutosave } from './autosave';
import { useEditor } from './editor-context';
import { ThemePicker } from './ThemePicker';

const schema = profileUpdateSchema.pick({
  theme: true,
  accentColor: true,
  appearance: true,
  testimonialStyle: true,
});
type Fields = {
  theme: string;
  accentColor: string;
  appearance: 'dark' | 'light';
  testimonialStyle: 'list' | 'carousel';
};

// Choosing a theme or an accent color shows in the preview at once and is saved by itself.
export function ThemesPage() {
  const { profile, saveFields, setDraft } = useEditor();
  const form = useForm<Fields, unknown, z.output<typeof schema>>({
    resolver: schemaResolver(schema),
    defaultValues: {
      theme: getTheme(profile.theme).key,
      accentColor: profile.accentColor,
      appearance: profile.appearance,
      testimonialStyle: profile.testimonialStyle,
    },
  });

  useEffect(() => {
    // While a hex code is half typed the preview keeps the last complete one.
    let accent = profile.accentColor;
    const publish = (v: Partial<Fields>) => {
      accent = normalizeHex(v.accentColor) ?? accent;
      setDraft({
        theme: v.theme ?? DEFAULT_THEME,
        accentColor: accent,
        appearance: v.appearance ?? profile.appearance,
        testimonialStyle: v.testimonialStyle ?? profile.testimonialStyle,
      });
    };
    publish(form.getValues());
    const subscription = form.watch(publish);
    return () => {
      subscription.unsubscribe();
      setDraft(null);
    };
  }, [form, setDraft, profile.accentColor, profile.appearance, profile.testimonialStyle]);

  async function save(values: z.output<typeof schema>) {
    await saveFields(values);
  }
  useFormAutosave(form, save);
  const theme = form.watch('theme');

  return (
    <section aria-label="Pick a look" className="space-y-4">
      <p className="text-sm text-muted">
        Try a few. Your words stay the same, and the preview shows each one with your own details.
      </p>
      <Form form={form} onSubmit={save}>
        <ThemePicker />
        <AccentPicker />
        {theme === 'aurora' && (
          <SelectField
            name="appearance"
            label="Aurora look"
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        )}
        {theme === 'sidebar' && (
          <SelectField
            name="testimonialStyle"
            label="Testimonials"
            options={[
              { value: 'list', label: 'A list (three shown, then “Show more”)' },
              { value: 'carousel', label: 'A carousel (never advances by itself)' },
            ]}
          />
        )}
      </Form>
    </section>
  );
}
