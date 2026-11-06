'use client';

import { ArrowRight, Check, Circle } from 'lucide-react';
import type { MyProfile } from '@parichay/shared';
import { Button, Card } from '../ui';
import { useEditor } from './editor-context';
import { useGo } from './navigation';

// What a portfolio needs to feel finished, in the order worth doing it. Each task says where to do
// it: a tab of the Profile page.
interface Task {
  key: string;
  done: (p: MyProfile) => boolean;
  todo: string; // the next-step button
  label: string; // the checklist
  tab: string;
}

const TASKS: Task[] = [
  { key: 'photo', done: (p) => !!p.avatarUrl, todo: 'Add a photo', label: 'Photo', tab: 'basics' },
  {
    key: 'tagline',
    done: (p) => !!p.tagline?.trim(),
    todo: 'Write a tagline',
    label: 'Tagline',
    tab: 'basics',
  },
  {
    key: 'about',
    done: (p) => !!p.about?.trim(),
    todo: 'Write your About text',
    label: 'About',
    tab: 'about',
  },
  {
    key: 'links',
    done: (p) => p.links.length > 0,
    todo: 'Add a link, like LinkedIn or GitHub',
    label: 'A link',
    tab: 'basics',
  },
  {
    key: 'experience',
    done: (p) => p.experience.length > 0,
    todo: 'Add your work experience: it is the first thing most visitors read',
    label: 'Experience',
    tab: 'experience',
  },
  {
    key: 'projects',
    done: (p) => p.projects.length > 0,
    todo: 'Add a project to show as selected work',
    label: 'Selected work',
    tab: 'projects',
  },
  {
    key: 'skills',
    done: (p) => p.skills.length > 0,
    todo: 'Add your skills',
    label: 'Skills',
    tab: 'skills',
  },
  {
    key: 'education',
    done: (p) => p.education.length > 0,
    todo: 'Add your education',
    label: 'Education',
    tab: 'education',
  },
];

export function completeness(profile: MyProfile) {
  const done = TASKS.filter((task) => task.done(profile)).length;
  return { done, total: TASKS.length, percent: Math.round((done / TASKS.length) * 100) };
}

// A line to go with the number: where they are, and a nudge that is honest about what is left.
// Nothing here pretends a page is finished before it is.
export function encouragement(percent: number, published: boolean) {
  if (percent === 100) {
    return published
      ? 'Everything is filled in and your page is live. Nicely done.'
      : 'Everything is filled in. Your page is ready to publish whenever you are.';
  }
  if (percent >= 75) return 'Almost there. Just a few finishing touches left.';
  if (percent >= 50) return 'You’re over halfway. Your page is really taking shape.';
  if (percent >= 25) return 'Good start. Each thing you add makes your page more you.';
  return 'Let’s get started. Your page is a blank canvas, and the first few details go quickly.';
}

export function Completeness() {
  const { profile } = useEditor();
  const go = useGo();
  const { done, total, percent } = completeness(profile);
  const next = TASKS.find((task) => !task.done(profile));
  const message = encouragement(percent, profile.published);

  return (
    <Card as="section" aria-labelledby="completeness-heading" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="completeness-heading" className="type-section">
          Your page so far
        </h2>
        <p className="text-sm font-medium tabular-nums">
          {percent}%<span className="sr-only"> complete</span>
        </p>
      </div>
      <div
        role="progressbar"
        aria-labelledby="completeness-heading"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${done} of ${total} steps done`}
        className="h-2 overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm">{message}</p>

      {next ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">Next up: {next.todo.toLowerCase()}.</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void go('/dashboard/profile', next.tab)}
          >
            {next.todo}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted">See what’s done so far</summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {TASKS.map((task) => {
            const complete = task.done(profile);
            return (
              <li key={task.key} className="flex items-center gap-2">
                {complete ? (
                  <Check aria-hidden="true" className="size-4 text-accent-fg" />
                ) : (
                  <Circle aria-hidden="true" className="size-4 text-muted" />
                )}
                <span className={complete ? '' : 'text-muted'}>
                  {task.label}
                  <span className="sr-only">{complete ? ' (done)' : ' (not done yet)'}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </Card>
  );
}
