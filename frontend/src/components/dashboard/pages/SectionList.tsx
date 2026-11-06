import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnyPageKey, ConfigKey } from '@parichay/shared';
import { Select } from '../../ui';
import { moveClass } from '../SortableList';
import { moveSection, shiftSection, type Row } from './arrangement';

// The sections on one page, in their order, each with buttons to move it earlier or later on the page
// and a list to put it on another page. Plain controls, so it works with a keyboard and a screen reader.
export function SectionList({
  page,
  rows,
  names,
  nameOf,
  notes,
  onChange,
}: {
  page: AnyPageKey;
  rows: Row[];
  names: { value: string; label: string }[]; // the pages a section can go to (Home is not one)
  nameOf: (key: ConfigKey) => string;
  notes: (key: ConfigKey) => string | null; // "Hidden" or "Nothing here yet", beside the name
  onChange: (rows: Row[]) => void;
}) {
  const sections = rows.find((row) => row.key === page)?.sections ?? [];
  if (sections.length === 0) {
    return <p className="text-sm text-muted">No sections on this page.</p>;
  }
  return (
    <ul className="space-y-2">
      {sections.map((key, index) => {
        const name = nameOf(key);
        const note = notes(key);
        return (
          <li key={key} className="flex flex-wrap items-center gap-2">
            <span className="flex shrink-0 items-center">
              <button
                type="button"
                aria-label={`Move ${name} up on this page`}
                disabled={index === 0}
                onClick={() => onChange(shiftSection(rows, page, key, -1))}
                className={moveClass}
              >
                <ChevronUp aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Move ${name} down on this page`}
                disabled={index === sections.length - 1}
                onClick={() => onChange(shiftSection(rows, page, key, 1))}
                className={moveClass}
              >
                <ChevronDown aria-hidden="true" className="size-4" />
              </button>
            </span>
            <span className="min-w-0 flex-1 basis-32 text-sm">
              <span className="font-medium">{name}</span>
              {note && <span className="text-muted"> ({note})</span>}
            </span>
            <div className="w-40 shrink-0">
              <Select
                aria-label={`Page for ${name}`}
                value={page}
                options={names}
                onChange={(target) => onChange(moveSection(rows, key, target as AnyPageKey))}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
