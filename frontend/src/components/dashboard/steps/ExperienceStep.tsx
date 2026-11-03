'use client';

import { Briefcase } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { DESCRIPTION_MAX, experienceInputSchema, type ExperienceInput } from '@parichay/shared';
import { schemaResolver } from '@/lib/form';
import { formatRange } from '@/lib/format';
import { TextArea, TextField } from '../../form-fields';
import { DateRangeFields, toMonth, type DateRangeValues } from '../DateRangeFields';
import { EditorForm } from '../EditorForm';
import { useSection } from '../editor-context';
import { SectionManager, type ItemFormProps } from '../SectionManager';

type Fields = DateRangeValues & { title: string; company: string; description: string };

function ExperienceForm({ item, draft, onDone, onSaved }: ItemFormProps<'experience'>) {
  const { create, updateItem } = useSection('experience');
  const source = item ?? draft; // a saved item, or a suggestion from a resume
  const form = useForm<Fields, unknown, ExperienceInput>({
    resolver: schemaResolver(experienceInputSchema),
    defaultValues: {
      title: source?.title ?? '',
      company: source?.company ?? '',
      startDate: toMonth(source?.startDate),
      endDate: toMonth(source?.endDate),
      current: source ? !source.endDate : false,
      description: source?.description ?? '',
    },
  });

  async function onSubmit(values: ExperienceInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save job" onCancel={onDone}>
      <TextField
        name="title"
        label="Job title"
        placeholder="e.g. Senior Product Designer"
        required
      />
      <TextField
        name="company"
        label="Company"
        placeholder="e.g. Acme Studio"
        hint="Changed roles here? Add each role as its own job with the same company name, one after the other, and your page shows them together under the company."
        required
      />
      <DateRangeFields presentLabel="I currently work here" />
      <TextArea
        name="description"
        label="What you did"
        rows={5}
        maxLength={DESCRIPTION_MAX}
        placeholder="Led the redesign of the checkout flow, which cut drop-off by a fifth."
        hint="Say what you did and what changed because of it. Numbers help, if you have them."
      />
    </EditorForm>
  );
}

export function ExperienceStep() {
  return (
    <section aria-labelledby="experience-heading" className="space-y-4">
      <div>
        <h2 id="experience-heading" className="type-section">
          Experience
        </h2>
        <p className="text-sm text-muted">
          Shown in this order on your page. Drag the grip to reorder. Your page shows the first few,
          and the rest sit under “Earlier roles”.
        </p>
      </div>
      <SectionManager
        section="experience"
        noun="job"
        addLabel="Add a job"
        icon={Briefcase}
        empty="Nothing here yet. Add your most recent job first, and the rest can follow."
        summary={(job) => ({
          title: `${job.title} at ${job.company}`,
          subtitle: `${formatRange(job.startDate, job.endDate)}`,
        })}
        Form={ExperienceForm}
      />
    </section>
  );
}
