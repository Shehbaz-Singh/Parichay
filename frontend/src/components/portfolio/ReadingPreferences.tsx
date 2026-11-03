'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { ALargeSmall } from 'lucide-react';
import type { Ui } from '@/lib/i18n';
import {
  CHOICES,
  applyPrefs,
  clearPrefs,
  getPrefs,
  getServerPrefs,
  resetPrefs,
  setPref,
  subscribePrefs,
  type Prefs,
  type Setting,
} from '@/lib/reading-prefs';
import { Button, Modal } from '../ui';

type Text = Ui['reading'];

// One radio group per setting. The first option is the default (no value).
const GROUPS: {
  setting: Setting;
  label: keyof Text;
  options: [string | undefined, keyof Text][];
}[] = [
  {
    setting: 'text',
    label: 'size',
    options: [
      [undefined, 'sizeDefault'],
      ['larger', 'sizeLarger'],
      ['largest', 'sizeLargest'],
    ],
  },
  {
    setting: 'font',
    label: 'font',
    options: [
      [undefined, 'fontTheme'],
      ['plain', 'fontPlain'],
      ['atkinson', 'fontAtkinson'],
    ],
  },
  {
    setting: 'lines',
    label: 'lines',
    options: [
      [undefined, 'linesDefault'],
      ['relaxed', 'linesRelaxed'],
    ],
  },
  {
    setting: 'motion',
    label: 'motion',
    options: [
      [undefined, 'motionSystem'],
      ['reduce', 'motionReduce'],
    ],
  },
];

// The button in the strip above a public page, and the dialog it opens. The choices apply as they
// are made and are kept in this browser only (lib/reading-prefs.ts). The dialog is the app's modal
// <dialog>: the page behind it is inert, Tab stays inside, Escape closes it, and focus returns to
// this button. The radios are native, so the arrow keys move within a group.
export function ReadingPreferences({
  ui,
  triggerClassName,
}: {
  ui: Text;
  // The button's own look, for a place that is not the strip (the navigation of a multi-page portfolio).
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, getServerPrefs);
  const id = useId();

  // The pre-paint script has set the attributes already; this keeps them right after a client-side
  // navigation, and takes them off again when the visitor leaves the public pages
  useEffect(() => {
    applyPrefs(getPrefs());
    return clearPrefs;
  }, []);

  const changed = Object.keys(CHOICES).some((setting) => prefs[setting as Setting]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={
          triggerClassName ??
          'inline-flex items-center gap-1.5 rounded border border-[#d8cdbd] bg-white/60 px-2.5 py-1 text-[#7f301a] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9e3d21]'
        }
      >
        <ALargeSmall aria-hidden="true" className="size-4" />
        {ui.button}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={ui.title}
        description={ui.intro}
        footer={
          <>
            <Button onClick={resetPrefs} disabled={!changed}>
              {ui.reset}
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              {ui.close}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-base">
          {GROUPS.map(({ setting, label, options }) => (
            <fieldset key={setting} className="min-w-0">
              <legend className="mb-1 text-sm font-semibold">{ui[label]}</legend>
              <div className="flex flex-wrap gap-2">
                {options.map(([value, name]) => {
                  const checked = (prefs[setting as keyof Prefs] as string | undefined) === value;
                  return (
                    <label
                      key={name}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-control border px-3 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-fg ${
                        checked ? 'border-ink bg-ink text-page' : 'border-line hover:bg-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${id}-${setting}`}
                        checked={checked}
                        onChange={() => setPref(setting, value as never)}
                        className="sr-only"
                      />
                      {ui[name]}
                    </label>
                  );
                })}
              </div>
              {setting === 'font' && <p className="mt-1 text-xs text-muted">{ui.fontNote}</p>}
            </fieldset>
          ))}
          <p className="rounded-control bg-surface px-3 py-2 text-xs text-muted">{ui.evidence}</p>
        </div>
      </Modal>
    </>
  );
}
