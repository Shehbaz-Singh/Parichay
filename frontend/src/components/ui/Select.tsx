'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { cx } from './cx';

export interface SelectOption {
  value: string;
  label: string;
}

// A dropdown drawn by the app (the browser's own list cannot be styled), built as the ARIA
// "select-only combobox": the button holds the focus, the arrow keys move through the list, Enter
// or Space picks, Escape closes, and typing a letter jumps to the next option starting with it.
export function Select({
  id,
  value,
  options,
  onChange,
  onBlur,
  disabled,
  className,
  ...aria
}: {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [active, setActive] = useState(selected);
  const optionId = (i: number) => `${listId}-${i}`;

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  // Opening near the bottom scrolls the list into view, clear of the mobile navigation bar.
  useEffect(() => {
    if (open) list.current?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  function show() {
    setActive(selected);
    setOpen(true);
  }
  function pick(i: number) {
    onChange(options[i].value);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    const last = options.length - 1;
    const move = (to: number) => {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive(Math.min(last, Math.max(0, to)));
    };
    switch (e.key) {
      case 'ArrowDown':
        return open ? move(active + 1) : (e.preventDefault(), show());
      case 'ArrowUp':
        return open ? move(active - 1) : (e.preventDefault(), show());
      case 'Home':
        return move(0);
      case 'End':
        return move(last);
      case 'Enter':
      case ' ':
        e.preventDefault();
        return open ? pick(active) : show();
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      case 'Tab':
        return setOpen(false);
      default: {
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        const letter = e.key.toLowerCase();
        const order = [...options.keys()];
        const next = [...order.slice(active + 1), ...order.slice(0, active + 1)].find((i) =>
          options[i].label.toLowerCase().startsWith(letter),
        );
        if (next !== undefined) move(next);
      }
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        {...aria}
        className={cx(
          'flex w-full items-center justify-between gap-2 rounded-control border border-line bg-page px-3 py-2 text-start text-sm disabled:bg-surface disabled:text-muted aria-invalid:border-danger',
          className,
        )}
      >
        <span className="min-w-0 truncate">{options[selected]?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cx('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className="absolute inset-x-0 z-20 scroll-mb-20 lg:scroll-mb-4 mt-1 max-h-60 overflow-auto [scrollbar-width:thin] rounded-control border border-line bg-page py-1 shadow-overlay"
        >
          {options.map((o, i) => (
            // Keyboard use goes through the button above (aria-activedescendant); these rows
            // only need to take a mouse or touch.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <div
              key={o.value}
              id={optionId(i)}
              role="option"
              tabIndex={-1}
              aria-selected={i === selected}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(i)}
              className={cx(
                'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
                i === active && 'bg-accent-soft',
                i === selected && 'font-semibold',
              )}
            >
              {o.label}
              {i === selected && (
                <Check aria-hidden="true" className="size-4 shrink-0 text-accent-fg" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
