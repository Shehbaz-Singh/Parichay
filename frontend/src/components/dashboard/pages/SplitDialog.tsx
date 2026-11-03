import { useState } from 'react';
import {
  defaultPageConfig,
  type AnyPageKey,
  type ConfigKey,
  type MyProfile,
} from '@parichay/shared';
import { Button, Modal } from '../../ui';
import { allSectionKeys } from '../page-content';
import { pageName, sectionName, toRows, type Row } from './arrangement';
import { SectionList } from './SectionList';

// "Split my portfolio into pages": proposes the standard arrangement (your work on Work, your story and
// skills on About, writing on Writing, contact on Contact) and lets the owner adjust it before anything
// is saved. Applying it only puts the arrangement into the page list, keeping each page's name and
// visibility; the list saves itself like any other change.
export function SplitDialog({
  profile,
  rows,
  willSwitch,
  notes,
  onApply,
  onClose,
}: {
  profile: MyProfile;
  rows: Row[]; // the current page list, for the names and what is shown
  willSwitch: boolean; // applying also switches to the pages layout
  notes: (key: ConfigKey) => string | null;
  onApply: (proposal: Row[]) => void;
  onClose: () => void;
}) {
  const [proposal, setProposal] = useState<Row[]>(() =>
    toRows(
      defaultPageConfig(
        profile.customPages.map((page) => page.id),
        allSectionKeys(profile),
      ),
    ),
  );
  const pages = proposal.filter((row) => row.key !== 'home');
  const names = pages.map((row) => ({ value: row.key, label: pageName(profile, row) }));

  return (
    <Modal
      open
      onClose={onClose}
      title="Split my portfolio into pages"
      description={
        <>
          Here is how your sections would be shared out. Change anything that doesn’t suit you, then
          apply it.{' '}
          {willSwitch ? 'Applying it also switches your portfolio to the pages layout. ' : ''}
          Nothing is deleted, and you can keep adjusting afterwards.
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // Keep each page's name and visibility; take only the arrangement.
              onApply(
                rows.map((row) => ({
                  ...row,
                  sections: proposal.find((p) => p.key === row.key)?.sections ?? row.sections,
                })),
              );
            }}
          >
            Apply this arrangement
          </Button>
        </>
      }
    >
      <div className="max-h-[50vh] space-y-4 overflow-y-auto pe-1">
        {pages.map((row) => (
          <section key={row.key} aria-label={pageName(profile, row)} className="space-y-2">
            <h3 className="text-sm font-semibold">{pageName(profile, row)}</h3>
            <SectionList
              page={row.key as AnyPageKey}
              rows={proposal}
              names={names}
              nameOf={(key) => sectionName(profile, key)}
              notes={notes}
              onChange={setProposal}
            />
          </section>
        ))}
        <p className="text-sm text-muted">
          Home is not made of sections: it shows your introduction, your featured projects, a short
          About and a way to contact you.
        </p>
      </div>
    </Modal>
  );
}
