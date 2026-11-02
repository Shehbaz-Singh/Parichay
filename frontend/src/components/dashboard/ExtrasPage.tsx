'use client';

import { useState, type ReactNode } from 'react';
import { Clock, FileDown, Inbox, Link2, Mail, Radio, UserPlus } from 'lucide-react';
import { Sheet } from '../ui';
import { useEditor } from './editor-context';
import { FeatureCard, PageHeader, type FeatureState } from './layout';
import { AvailabilityCard } from './steps/AvailabilityCard';
import { ContactCardCard } from './steps/ContactCardCard';
import { ResumeCard } from './steps/ResumeCard';
import { WorkingTogetherCard } from './steps/WorkingTogetherCard';

type SheetId = 'availability' | 'work' | 'contact-card' | 'resume';

const SHEETS: Record<SheetId, { title: string; description: string; body: ReactNode }> = {
  availability: {
    title: 'Availability',
    description: 'A small badge near the top of your page.',
    body: <AvailabilityCard />,
  },
  work: {
    title: 'Working together',
    description: 'Your time zone and working hours, shown on your page.',
    body: <WorkingTogetherCard />,
  },
  'contact-card': {
    title: 'Contact card',
    description: 'Let visitors save you to their contacts.',
    body: <ContactCardCard />,
  },
  resume: {
    title: 'Resume download',
    description: 'A PDF made from your page.',
    body: <ResumeCard />,
  },
};

const onOff = (on: boolean): FeatureState => (on ? 'on' : 'off');

// The optional features of a page, as cards: what each is, whether it is on, and one button to set
// it up. The small ones open in a side panel; the big ones (link-in-bio, the email signature) and the
// contact form (which lives beside the inbox it feeds) have a page of their own.
export function ExtrasPage() {
  const { profile } = useEditor();
  const [open, setOpen] = useState<SheetId | null>(null);
  const sheet = open ? SHEETS[open] : null;

  return (
    <>
      <PageHeader
        title="Share & extras"
        description="Optional features for your page. Switch on what you need; the rest stays out of the way. Publishing and the page link are in the bar at the top."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        <FeatureCard
          icon={Radio}
          title="Availability"
          description="Tell visitors you are open to work, or busy."
          state={onOff(profile.availabilityEnabled)}
          actionLabel={profile.availabilityEnabled ? 'Manage' : 'Set up'}
          onAction={() => setOpen('availability')}
        />
        <FeatureCard
          icon={Clock}
          title="Working together"
          description="Your local time and working hours, so people know when to reach you."
          state={!profile.workCardEnabled ? 'off' : profile.timezone ? 'on' : 'setup'}
          stateNote={profile.workCardEnabled && !profile.timezone ? 'add a time zone' : undefined}
          actionLabel={profile.workCardEnabled ? 'Manage' : 'Set up'}
          onAction={() => setOpen('work')}
        />
        <FeatureCard
          icon={UserPlus}
          title="Contact card"
          description="An “Add to contacts” button that saves you as a contact (.vcf)."
          state={onOff(profile.contactCardEnabled)}
          stateNote={
            !profile.published && !profile.contactCardEnabled ? 'publish first' : undefined
          }
          actionLabel={profile.contactCardEnabled ? 'Manage' : 'Set up'}
          onAction={() => setOpen('contact-card')}
        />
        <FeatureCard
          icon={FileDown}
          title="Resume download"
          description="A “Download resume” PDF, made from your page."
          state={onOff(profile.resumeEnabled)}
          actionLabel="Manage"
          onAction={() => setOpen('resume')}
        />
        <FeatureCard
          icon={Inbox}
          title="Contact form"
          description="Let visitors write to you from your page. Messages arrive in your inbox."
          state={onOff(profile.contactFormEnabled && !profile.isSample)}
          actionLabel={profile.contactFormEnabled ? 'Manage' : 'Set up'}
          href="/dashboard/messages"
        />
        <FeatureCard
          icon={Link2}
          title="Link-in-bio card"
          description="A single short link for your social profiles, with buttons you choose."
          state={onOff(profile.linkBioEnabled)}
          actionLabel={profile.linkBioEnabled ? 'Manage' : 'Set up'}
          href="/dashboard/link-bio"
        />
        <FeatureCard
          icon={Mail}
          title="Email signature"
          description="A signature with your photo and links for Gmail, Outlook and others."
          actionLabel="Open"
          href="/dashboard/signature"
        />
      </ul>

      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title={sheet?.title ?? ''}
        description={sheet?.description}
        width="lg"
      >
        {sheet?.body}
      </Sheet>
    </>
  );
}
