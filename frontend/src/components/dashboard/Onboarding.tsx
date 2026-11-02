'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { readFlag, writeFlag } from '@/lib/storage';
import { Button, Modal } from '../ui';
import { cx } from '../ui/cx';
import { isBlank, useEditor } from './editor-context';
import { firstName } from './Greeting';
import { useGo } from './navigation';

const STEPS = [
  {
    title: 'Welcome. Let’s build your page',
    body: 'In a few minutes you’ll have a page of your own that you can share with anyone. No design skills needed, and you can change everything later.',
  },
  {
    title: 'Start from your resume, or from scratch',
    body: 'Upload a PDF resume and we’ll fill in what we can find. You check it before anything is saved. Or skip that and type it in yourself. Both work.',
  },
  {
    title: 'Pick a look',
    body: 'Choose a theme and an accent color on the Themes page. Try a few. Your content stays exactly as it is.',
  },
  {
    title: 'Watch it take shape',
    body: 'The preview beside the form is your real page. Type something and it appears there as you go. Switch between phone, tablet and desktop to check it everywhere.',
  },
  {
    title: 'Publish when you’re ready',
    body: 'Your page stays private until you flip the Published switch at the top. Then it’s live at your own link, ready to share.',
  },
];

// A short tour for someone with an empty profile: five steps, a count of where they are, and a Skip
// that is always there. It is shown once per browser; skipping or finishing both count. The decision
// is made when the dashboard first loads, so adding a photo mid-tour does not make it vanish.
export function Onboarding() {
  const { profile } = useEditor();
  const go = useGo();
  const key = `onboarding-done:${profile.id}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isBlank(profile) && !readFlag(key)) setOpen(true);
    // Only on arrival: later edits must not reopen or close it.
  }, []);

  function close() {
    writeFlag(key);
    setOpen(false);
  }

  const last = step === STEPS.length - 1;
  const { title, body } = STEPS[step];
  const name = firstName(profile.fullName);

  return (
    <Modal
      open={open}
      onClose={close}
      title={step === 0 && name ? `Welcome, ${name}. Let’s build your page` : title}
      description={body}
      footer={
        <>
          <Button variant="ghost" onClick={close} className="me-auto">
            Skip the tour
          </Button>
          {step > 0 && (
            <Button onClick={() => setStep(step - 1)}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => {
              if (!last) return setStep(step + 1);
              close();
              void go('/dashboard/profile', 'import');
            }}
          >
            {last ? 'Let’s begin' : 'Next'}
            {!last && <ArrowRight aria-hidden="true" className="size-4" />}
          </Button>
        </>
      }
    >
      <div>
        <p className="mb-2 text-xs font-medium text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <div
          role="progressbar"
          aria-label="Tour progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${STEPS.length}`}
          className="flex gap-1.5"
        >
          {STEPS.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-line')}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
