'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Two ways to fold away what most visitors will not read, both with the folded content in the page
// (not fetched later), so search engines read it, the page prints it whole, and with JavaScript off
// it is simply shown (the rules are in globals.css and the <noscript> in ThemeWrapper).

const BUTTON =
  'inline-block text-sm font-semibold text-accent-fg underline underline-offset-2 hover:no-underline print:hidden';

// A button that opens a block that was closed: "Earlier roles (5)", "More projects (9)".
export function Collapse({
  label,
  closeLabel,
  children,
  className,
  buttonClassName,
}: {
  label: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button
        type="button"
        className={`collapse-btn ${buttonClassName ?? BUTTON}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {open ? closeLabel : label}
      </button>
      <div id={id} className="collapse-body" data-open={open}>
        {children}
      </div>
    </div>
  );
}

// A long text cut to a few lines, with a button that shows the rest. The button only appears if the
// text really is cut (a wide screen may fit it all).
export function ClampedText({
  text,
  className,
  more,
  less,
  lines,
}: {
  text: string;
  className?: string;
  more: string;
  less: string;
  lines: number;
}) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  return (
    <>
      <p
        id={id}
        ref={ref}
        className={`readmore ${className ?? ''}`}
        data-clamp={open ? 'off' : 'on'}
        style={{ '--lines': lines } as CSSProperties}
      >
        {text}
      </p>
      <button
        type="button"
        hidden={!clipped && !open}
        className={`readmore-btn mt-1 ${BUTTON}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {open ? less : more}
      </button>
    </>
  );
}
