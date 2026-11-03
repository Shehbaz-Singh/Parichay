import { useId } from 'react';
import type { LayoutMode } from '@parichay/shared';
import { cx } from '../../ui/cx';

// A tiny drawing of each layout: one long page, or a site with a menu and a page at a time. It is
// decoration; the words beside it say the same.
function Sketch({ mode }: { mode: LayoutMode }) {
  const bar = 'rounded-full bg-line';
  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-full gap-2 rounded-box border border-line bg-page p-2"
    >
      {mode === 'single' ? (
        <div className="flex flex-1 flex-col gap-1.5">
          <div className={cx(bar, 'h-3 w-1/3 !bg-accent')} />
          <div className={cx(bar, 'h-1.5 w-full')} />
          <div className={cx(bar, 'h-1.5 w-5/6')} />
          <div className={cx(bar, 'mt-1 h-1.5 w-1/4 !bg-ink/40')} />
          <div className={cx(bar, 'h-1.5 w-full')} />
          <div className={cx(bar, 'h-1.5 w-2/3')} />
          <div className={cx(bar, 'mt-1 h-1.5 w-1/4 !bg-ink/40')} />
          <div className={cx(bar, 'h-1.5 w-4/5')} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex gap-1.5 border-b border-line pb-1.5">
            <div className={cx(bar, 'h-2 w-8 !bg-accent')} />
            <div className={cx(bar, 'h-2 w-8')} />
            <div className={cx(bar, 'h-2 w-8')} />
            <div className={cx(bar, 'h-2 w-8')} />
          </div>
          <div className={cx(bar, 'h-3 w-1/3 !bg-ink/40')} />
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            <div className="rounded bg-surface" />
            <div className="rounded bg-surface" />
            <div className="rounded bg-surface" />
          </div>
        </div>
      )}
    </div>
  );
}

const OPTIONS: { mode: LayoutMode; title: string; text: string }[] = [
  {
    mode: 'single',
    title: 'One page',
    text: 'Everything on one page you scroll through. Simple, and right for a short portfolio.',
  },
  {
    mode: 'multi',
    title: 'Pages',
    text: 'A short Home page, with Work, About and other pages in a menu, and a page for each project. Right when you have a lot to show.',
  },
];

// The choice between the two layouts, as radio buttons. The change itself is the parent's to confirm,
// so `onChoose` is only asked for, and the radio keeps showing the current layout until it is made.
export function LayoutChoice({
  mode,
  onChoose,
}: {
  mode: LayoutMode;
  onChoose: (mode: LayoutMode) => void;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Layout of your portfolio</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const id = `${name}-${option.mode}`;
          const checked = mode === option.mode;
          return (
            <label
              key={option.mode}
              htmlFor={id}
              className={cx(
                'flex cursor-pointer flex-col gap-3 rounded-card border p-card-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                checked ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface',
              )}
            >
              <Sketch mode={option.mode} />
              <span className="flex items-start gap-2">
                <input
                  id={id}
                  type="radio"
                  name={name}
                  checked={checked}
                  onChange={() => onChoose(option.mode)}
                  className="mt-1 size-4 accent-accent"
                />
                <span>
                  <span className="block font-medium">{option.title}</span>
                  <span className="block text-sm text-muted">{option.text}</span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
