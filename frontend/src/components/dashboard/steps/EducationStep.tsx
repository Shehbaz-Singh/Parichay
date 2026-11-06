'use client';

import { GraduationCap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { educationInputSchema, type EducationInput } from '@parichay/shared';
import { schemaResolver } from '@/lib/form';
import { formatRange } from '@/lib/format';
import { TextField } from '../../form-fields';
import { DateRangeFields, toMonth, type DateRangeValues } from '../DateRangeFields';
import { EditorForm } from '../EditorForm';
import { useSection } from '../editor-context';
import { SectionManager, type ItemFormProps } from '../SectionManager';

type Fields = DateRangeValues & { degree: string; institution: string };

function EducationForm({ item, draft, onDone, onSaved }: ItemFormProps<'education'>) {
  const { create, updateItem } = useSection('education');
  const source = item ?? draft; // a saved item, or a suggestion from a resume
  const form = useForm<Fields, unknown, EducationInput>({
    resolver: schemaResolver(educationInputSchema),
    defaultValues: {
      degree: source?.degree ?? '',
      institution: source?.institution ?? '',
      startDate: toMonth(source?.startDate),
      endDate: toMonth(source?.endDate),
      current: source ? !source.endDate : false,
    },
  });

  async function onSubmit(values: EducationInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save education" onCancel={onDone}>
      <TextField
        name="degree"
        label="Degree or course"
        placeholder="e.g. BSc Computer Science"
        required
      />
      <TextField
        name="institution"
        label="School or university"
        placeholder="e.g. University of Pune"
        required
      />
      <DateRangeFields presentLabel="I am still studying here" />
    </EditorForm>
  );
}

export function EducationStep() {
  return (
    <section aria-labelledby="education-heading" className="space-y-4">
      <div>
        <h2 id="education-heading" className="type-section">
          Education
        </h2>
        <p className="text-sm text-muted">
          Shown in this order on your page. Drag the grip to reorder.
        </p>
      </div>
      <SectionManager
        section="education"
        noun="entry"
        addLabel="Add education"
        icon={GraduationCap}
        empty="Nothing here yet. Add a degree, a course or a bootcamp, whatever you’re proud of."
        summary={(entry) => ({
          title: entry.degree,
          subtitle: `${entry.institution} · ${formatRange(entry.startDate, entry.endDate)}`,
        })}
        Form={EducationForm}
      />
    </section>
  );
}
