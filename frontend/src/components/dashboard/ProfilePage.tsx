'use client';

import type { ComponentType } from 'react';
import { Tabs, type TabItem } from '../ui';
import { useEditor } from './editor-context';
import { PageHeader } from './layout';
import { useLeaveGuard } from './navigation';
import { AboutStep } from './steps/AboutStep';
import { BasicsStep } from './steps/BasicsStep';
import { CustomSectionsStep } from './steps/CustomSectionsStep';
import { EducationStep } from './steps/EducationStep';
import { ExperienceStep } from './steps/ExperienceStep';
import { ImportStep } from './steps/ImportStep';
import { ProjectsStep } from './steps/ProjectsStep';
import { SkillsStep } from './steps/SkillsStep';
import { WritingStep } from './steps/WritingStep';

interface ProfileTab {
  id: string;
  label: string;
  Component: ComponentType<{ goTo: (tabId: string) => void }>;
}

// "Import resume" comes first: an optional shortcut for a brand-new profile.
const TABS: ProfileTab[] = [
  { id: 'import', label: 'Import resume', Component: ImportStep },
  { id: 'basics', label: 'Basics', Component: BasicsStep },
  { id: 'about', label: 'About', Component: AboutStep },
  { id: 'experience', label: 'Experience', Component: ExperienceStep },
  { id: 'projects', label: 'Selected work', Component: ProjectsStep },
  { id: 'skills', label: 'Skills', Component: SkillsStep },
  { id: 'education', label: 'Education', Component: EducationStep },
  { id: 'writing', label: 'Writing', Component: WritingStep },
  { id: 'custom', label: 'Custom sections', Component: CustomSectionsStep },
];
const TAB_ITEMS: TabItem[] = TABS.map(({ id, label }) => ({ id, label }));

// Everything about you that goes on the page, one tab per kind of content. Which tab is open lives
// in the editor, so other pages can send you straight to one ("add a photo").
export function ProfilePage() {
  const { tab, setTab } = useEditor();
  const canLeave = useLeaveGuard();
  const { Component } = TABS.find((t) => t.id === tab) ?? TABS[1];

  async function goTo(id: string) {
    if (id !== tab && (await canLeave())) setTab(id);
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Everything about you that goes on your page, one tab for each kind of content."
      />
      <Tabs
        label="Profile sections"
        idBase="profile"
        tabs={TAB_ITEMS}
        value={tab}
        onChange={(id) => void goTo(id)}
      >
        <Component goTo={goTo} />
      </Tabs>
    </>
  );
}
