'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cx } from './cx';

const widths = { md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' };

// A panel that slides in from the side, on the browser's own <dialog> like Modal: the page behind is
// inert, Tab stays inside, Escape closes it, and focus goes back to what opened it. It is for a
// form or a preview that belongs to the page behind it, so closing it leaves you where you were.
export function Sheet({
  open,
  onClose,
  title,
  description,
  side = 'end',
  width = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  side?: 'start' | 'end';
  width?: keyof typeof widths;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
      if (open) opener?.focus();
    };
  }, [open]);

  return (
    // Escape is handled by onCancel; the click is only a mouse shortcut for closing.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx(
        'm-0 h-dvh max-h-dvh w-full rounded-none bg-page p-0 text-ink shadow-overlay backdrop:bg-black/40 open:flex open:flex-col',
        widths[width],
        side === 'end' ? 'ms-auto' : 'me-auto',
      )}
    >
      {open && (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-line px-card py-3">
            <div className="min-w-0">
              <h2 id={titleId} className="type-section">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-0.5 text-sm text-muted">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-me-2 inline-flex size-9 shrink-0 items-center justify-center rounded-control hover:bg-surface active:bg-line"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-card">{children}</div>
        </>
      )}
    </dialog>
  );
}
