'use client';

import { useState } from 'react';
import { FolderKanban, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  DESCRIPTION_MAX,
  FEATURED_PROJECTS_MAX,
  projectInputSchema,
  type ProjectInput,
} from '@parichay/shared';
import { ApiError } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { SelectField, TextArea, TextField } from '../../form-fields';
import { EditorForm } from '../EditorForm';
import { useEditor, useSection, type SectionItem } from '../editor-context';
import { LengthNote } from '../LengthNote';
import { ProjectMedia } from './ProjectMedia';
import { Button } from '../../ui';
import { SectionManager, type ItemFormProps } from '../SectionManager';

// Tags are typed as "Go, Rust, SQL" and sent as a list.
type Fields = {
  name: string;
  slug: string;
  url: string;
  description: string;
  techTags: string;
  featured: boolean;
  coverAlt: string;
  experienceId: string; // '' means none
};
const splitTags = (text: string) =>
  text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

function ProjectForm({ item, draft, onDone, onSaved }: ItemFormProps<'projects'>) {
  const { create, updateItem } = useSection('projects');
  const { profile } = useEditor();
  const source = item ?? draft; // a saved item, or a suggestion from a resume
  const form = useForm<Fields, unknown, ProjectInput>({
    resolver: schemaResolver(projectInputSchema, (v: Fields) => ({
      ...v,
      techTags: splitTags(v.techTags),
      experienceId: v.experienceId || null,
    })),
    defaultValues: {
      name: source?.name ?? '',
      slug: item?.slug ?? '',
      coverAlt: item?.coverAlt ?? '',
      url: source?.url ?? '',
      description: source?.description ?? '',
      techTags: source?.techTags.join(', ') ?? '',
      featured: item?.featured ?? false,
      experienceId: item?.experienceId ?? '',
    },
  });

  async function onSubmit(values: ProjectInput) {
    // A description of a cover that is not there any more is not kept.
    const input = { ...values, coverAlt: item?.coverUrl ? values.coverAlt : null };
    await (item ? updateItem(item.id, input) : create(input));
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm
      form={form}
      onSubmit={onSubmit}
      submitLabel="Save project"
      onCancel={onDone}
      codeFields={{ SLUG_TAKEN: 'slug' }}
    >
      <TextField
        name="name"
        label="Project name"
        placeholder="e.g. Recipe Box, a meal planner"
        required
      />
      <TextField
        name="url"
        label="Link"
        placeholder="https://"
        hint="Optional. Where people can see it live or read the code."
        autoCapitalize="none"
        spellCheck={false}
      />
      <TextArea
        name="description"
        label="Description"
        rows={4}
        maxLength={DESCRIPTION_MAX}
        placeholder="A weekly meal planner that builds your shopping list for you."
        hint="What it is, who it’s for, and what you did on it. About 300 characters reads well; longer text is folded behind “Read more” on your page."
      />
      {profile.experience.length > 0 && (
        <SelectField
          name="experienceId"
          label="Built while at"
          options={[
            { value: '', label: 'No job in particular' },
            ...profile.experience.map((job) => ({
              value: job.id,
              label: `${job.company}: ${job.title}`,
            })),
          ]}
        />
      )}
      <TextField
        name="techTags"
        label="Technologies"
        placeholder="React, Node.js, PostgreSQL"
        hint="Separate with commas. Up to 20."
      />
      <TextField
        name="slug"
        label="Page address"
        placeholder={item ? undefined : 'made from the name'}
        hint={
          item
            ? 'Lowercase letters, numbers and hyphens: yourname/work/address. Changing it breaks links people already have to this project’s page.'
            : 'Optional. Made from the name if you leave it blank.'
        }
        autoCapitalize="none"
        spellCheck={false}
        maxLength={60}
      />
      <ProjectMedia project={item} />
    </EditorForm>
  );
}

// The star: a featured project leads your page. Up to FEATURED_PROJECTS_MAX.
function FeaturedToggle({ project }: { project: SectionItem<'projects'> }) {
  const { items, updateItem } = useSection('projects');
  const { notify } = useEditor();
  const [pending, setPending] = useState(false);
  const featuredCount = items.filter((item) => item.featured).length;
  const full = !project.featured && featuredCount >= FEATURED_PROJECTS_MAX;

  async function toggle() {
    setPending(true);
    try {
      await updateItem(project.id, {
        name: project.name,
        url: project.url,
        description: project.description,
        techTags: project.techTags,
        coverAlt: project.coverAlt,
        featured: !project.featured,
      });
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : 'We couldn’t update that project.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      aria-pressed={project.featured}
      disabled={pending || full}
      title={full ? `You can feature up to ${FEATURED_PROJECTS_MAX} projects` : undefined}
      onClick={toggle}
      aria-label={`${project.featured ? 'Unfeature' : 'Feature'} ${project.name}`}
    >
      <Star aria-hidden="true" className={project.featured ? 'size-4 fill-current' : 'size-4'} />
      <span className="max-sm:sr-only">{project.featured ? 'Featured' : 'Feature'}</span>
    </Button>
  );
}

export function ProjectsStep() {
  const { items } = useSection('projects');
  const featured = items.filter((item) => item.featured).length;
  return (
    <section aria-labelledby="projects-heading" className="space-y-4">
      <div>
        <h2 id="projects-heading" className="type-section">
          Projects
        </h2>
        <p className="text-sm text-muted">
          Shown in this order on your page. Drag the grip to reorder. Star up to{' '}
          {FEATURED_PROJECTS_MAX} to put them first. With none starred, a long list shows the first
          few.
        </p>
        <LengthNote
          count={items.length}
          noun="projects"
          advice={`Most visitors read about 3 to 5. ${featured} featured.`}
        />
      </div>
      <SectionManager
        section="projects"
        noun="project"
        addLabel="Add a project"
        icon={FolderKanban}
        empty="Nothing here yet. Add your first project. Even a small one is worth showing."
        summary={(project) => ({
          title: project.name,
          subtitle: project.techTags.join(', ') || undefined,
        })}
        Form={ProjectForm}
        extra={(project) => <FeaturedToggle project={project} />}
      />
    </section>
  );
}
