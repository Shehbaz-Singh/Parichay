import {
  PAGE_LABELS,
  customIdOf,
  isCustomKey,
  isCustomPageKey,
  SECTION_LABELS,
  type AnyPageKey,
  type ConfigKey,
  type MyProfile,
  type PageConfig,
} from '@parichay/shared';

// The page list as the Pages screen edits it. A name is plain text here: blank means "use the
// standard name".
export interface Row {
  key: AnyPageKey;
  visible: boolean;
  title: string;
  sections: ConfigKey[];
}

export const toRows = (config: PageConfig): Row[] =>
  config.map(({ key, visible, title, sections }) => ({
    key,
    visible,
    title: title ?? '',
    sections,
  }));

// Home has no sections, and a custom page's name is its own title, so neither stores a name here.
export const toConfig = (rows: Row[]): PageConfig =>
  rows.map(({ key, visible, title, sections }) => ({
    key,
    visible,
    ...(title.trim() && !isCustomPageKey(key) && { title: title.trim() }),
    sections,
  }));

// The name a page has in the navigation.
export const pageName = (profile: MyProfile, row: Pick<Row, 'key' | 'title'>) =>
  isCustomPageKey(row.key)
    ? (profile.customPages.find((page) => `page:${page.id}` === row.key)?.title ?? 'Page')
    : row.title.trim() || PAGE_LABELS[row.key];

export const sectionName = (profile: MyProfile, key: ConfigKey) =>
  isCustomKey(key)
    ? (profile.customSections.find((section) => section.id === customIdOf(key))?.title ??
      'Custom section')
    : SECTION_LABELS[key];

// Puts a section on another page (at the end of it). Home takes none.
export function moveSection(rows: Row[], section: ConfigKey, target: AnyPageKey): Row[] {
  if (target === 'home') return rows;
  return rows.map((row) => {
    const rest = row.sections.filter((key) => key !== section);
    return row.key === target
      ? { ...row, sections: [...rest, section] }
      : { ...row, sections: rest };
  });
}

// Moves a section one place earlier or later on its page.
export function shiftSection(rows: Row[], page: AnyPageKey, section: ConfigKey, by: -1 | 1): Row[] {
  return rows.map((row) => {
    if (row.key !== page) return row;
    const from = row.sections.indexOf(section);
    const to = from + by;
    if (from < 0 || to < 0 || to >= row.sections.length) return row;
    const sections = [...row.sections];
    [sections[from], sections[to]] = [sections[to], sections[from]];
    return { ...row, sections };
  });
}
