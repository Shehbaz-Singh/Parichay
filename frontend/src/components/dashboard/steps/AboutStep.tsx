'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ABOUT_MAX, profileUpdateSchema } from '@parichay/shared';
import { schemaResolver } from '@/lib/form';
import { Form, TextArea } from '../../form-fields';
import { useFormAutosave } from '../autosave';
import { useEditor, useReportDirty } from '../editor-context';
import { NOTICES } from '@/lib/messages';

const schema = profileUpdateSchema.pick({ about: true });
type Fields = { about: string };

// Saves by itself shortly after typing stops. A summary read from a resume is the exception: it
// arrives as an edit to review and is saved by the button, so nothing from a resume is saved unseen.
export function AboutStep() {
  const { profile, saveFields, setDraft, notify, takeFields } = useEditor();
  const [reviewing, setReviewing] = useState(false);
  const form = useForm<Fields, unknown, z.output<typeof schema>>({
    resolver: schemaResolver(schema),
    defaultValues: { about: profile.about ?? '' },
  });
  useReportDirty(reviewing);

  useEffect(() => {
    const publish = (v: Partial<Fields>) => setDraft({ about: v.about || null });
    publish(form.getValues());
    const subscription = form.watch(publish);
    return () => {
      subscription.unsubscribe();
      setDraft(null);
    };
  }, [form, setDraft]);

  useEffect(() => {
    const { about } = takeFields(['about']);
    if (about) {
      form.setValue('about', about, { shouldDirty: true });
      setReviewing(true);
    }
  }, [form, takeFields]);

  async function save(values: z.output<typeof schema>) {
    await saveFields(values);
    if (reviewing) {
      setReviewing(false);
      notify('success', NOTICES.saved);
    }
  }
  useFormAutosave(form, save, { enabled: !reviewing });

  return (
    <section aria-labelledby="about-heading" className="space-y-4">
      <h2 id="about-heading" className="type-section">
        A little about you
      </h2>
      <Form form={form} onSubmit={save} submitLabel={reviewing ? 'Save about' : undefined}>
        <TextArea
          name="about"
          label="About"
          rows={10}
          maxLength={ABOUT_MAX}
          placeholder="Hi, I'm Priya. I design apps people actually enjoy using. Lately I've been working on…"
          hint="Write the way you'd introduce yourself to someone new: who you are, what you do, what you care about. Two or three short paragraphs (about 600 characters) is plenty; longer text is folded behind “Read more”. A blank line starts a new paragraph. Saved as you type."
        />
      </Form>
    </section>
  );
}
