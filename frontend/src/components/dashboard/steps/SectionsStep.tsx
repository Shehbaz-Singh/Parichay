'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  SECTION_LABELS,
  SECTION_TITLE_MAX,
  customIdOf,
  defaultSectionConfig,
  isCustomKey,
  type ConfigKey,
  type MyProfile,
  type SectionConfig,
  type SectionKey,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { Button, Card, Input, Switch } from '../../ui';
import { useAutosave } from '../autosave';
import { useEditor } from '../editor-context';
import { useGo } from '../navigation';
import { InfoToggle } from '../layout';
import { SortableList } from '../SortableList';

// What the form edits. A title is plain text here: blank means "use the default heading".
type Row = { key: ConfigKey; visible: boolean; title: string };

const toRows = (config: SectionConfig): Row[] =>
  config.map(({ key, visible, title }) => ({ key, visible, title: title ?? '' }));

const toConfig = (rows: Row[]): SectionConfig =>
  rows.map(({ key, visible, title }) => ({
    key,
    visible,
    ...(title.trim() && { title: title.trim() }),
  }));

// A section that is switched on but has nothing in it is not shown; the row says so.
const BUILT_IN_HAS_CONTENT: Record<SectionKey, (profile: MyProfile) => boolean> = {
  about: (p) => !!p.about?.trim(),
  skills: (p) => p.skills.length > 0,
  experience: (p) => p.experience.length > 0,
  projects: (p) => p.projects.length > 0,
  education: (p) => p.education.length > 0,
  testimonials: (p) => p.acceptTestimonials || p.testimonials.some((t) => t.status === 'approved'),
  writing: (p) => (p.posts ?? []).some((post) => post.status === 'published'),
  contact: (p) => p.contactFormEnabled && !p.isSample,
};

// A custom section is looked up by id; one that no longer exists has nothing to show.
const customSectionOf = (profile: MyProfile, key: ConfigKey) =>
  isCustomKey(key) ? profile.customSections.find((s) => s.id === customIdOf(key)) : undefined;

const labelOf = (profile: MyProfile, key: ConfigKey) =>
  isCustomKey(key)
    ? (customSectionOf(profile, key)?.title ?? 'Custom section')
    : SECTION_LABELS[key];

const hasContent = (profile: MyProfile, key: ConfigKey) =>
  isCustomKey(key)
    ? (customSectionOf(profile, key)?.items.length ?? 0) > 0
    : BUILT_IN_HAS_CONTENT[key](profile);

// Choose which sections the page shows, in what order, and under which heading. Only the layout
// is saved here: hiding a section keeps its content. Changes show in the preview at once and are
// saved by themselves a moment later.
export function SectionsStep() {
  const { profile, update, setDraft } = useEditor();
  const go = useGo();
  const [rows, setRows] = useState(() => toRows(profile.sectionConfig));

  const config = useMemo(() => toConfig(rows), [rows]);

  useEffect(() => {
    setDraft({ sectionConfig: config });
    return () => setDraft(null);
  }, [config, setDraft]);

  // The rows are not replaced by the server's answer: that would undo typing done while the
  // request was on its way.
  useAutosave({
    key: JSON.stringify(config),
    run: async () => {
      const { sections } = await api<{ sections: SectionConfig }>('/profile/me/sections', {
        method: 'PUT',
        body: { sections: config },
      });
      update((p) => ({ ...p, sectionConfig: sections }));
      return 'saved';
    },
  });

  const patch = (key: ConfigKey, change: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));
  const reorder = (ids: string[]) =>
    setRows((current) => ids.flatMap((id) => current.find((row) => row.key === id) ?? []));

  return (
    <section aria-label="Order and headings" className="space-y-4">
      <p className="text-sm text-muted">
        Hiding a section keeps everything you wrote in it, so there’s no risk in trying things out.
      </p>
      <InfoToggle label="How to reorder with the keyboard">
        Focus a grip, press Space, move with the arrow keys, then press Space again.
      </InfoToggle>

      <SortableList
        items={rows.map((row) => ({ ...row, id: row.key }))}
        onReorder={reorder}
        label={(row) => labelOf(profile, row.key)}
        renderItem={(row, handle) => {
          const label = labelOf(profile, row.key);
          const custom = isCustomKey(row.key);
          const inputId = `section-title-${row.key}`;
          return (
            <Card padding="sm" className="space-y-3">
              <div className="flex items-center gap-3">
                {handle}
                <span className={`font-medium ${row.visible ? '' : 'text-muted'}`}>{label}</span>
                <span className="ms-auto text-sm text-muted">
                  {row.visible ? 'Shown' : 'Hidden'}
                </span>
                <Switch
                  checked={row.visible}
                  label={`Show ${label}`}
                  onClick={() => patch(row.key, { visible: !row.visible })}
                />
              </div>
              {custom ? (
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  The heading is the section's own title.
                  <Button variant="ghost" onClick={() => void go('/dashboard/profile', 'custom')}>
                    Edit items and title
                  </Button>
                </p>
              ) : (
                <div>
                  <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-muted">
                    Heading on your page
                  </label>
                  <Input
                    id={inputId}
                    value={row.title}
                    onChange={(e) => patch(row.key, { title: e.target.value })}
                    placeholder={label}
                    maxLength={SECTION_TITLE_MAX}
                  />
                </div>
              )}
              {row.visible && !hasContent(profile, row.key) && (
                <p className="text-sm text-muted">
                  Nothing here yet, so this section stays off your page until you add something.
                </p>
              )}
            </Card>
          );
        }}
      />

      <Button variant="ghost" onClick={() => setRows(toRows(defaultSectionConfig()))}>
        Reset to default
      </Button>
    </section>
  );
}
