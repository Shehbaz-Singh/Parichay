'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, ChevronDown, Info, type LucideIcon } from 'lucide-react';
import { Badge, Button, Card, buttonStyles } from '../ui';
import { cx } from '../ui/cx';

// The few pieces every dashboard page is made of, so the pages share one type scale, one card style
// and one spacing rhythm: a PageHeader on top; SectionCards (or FeatureCards in a grid) below;
// SettingRows inside them; and Collapsible / InfoToggle for what most people never need to open.

// Moving between dashboard pages puts focus on the new page's title, so a keyboard or screen
// reader user lands at the top of what opened. The first page of a visit leaves focus alone.
let navigated = false;

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (navigated) heading.current?.focus({ preventScroll: true });
    navigated = true;
  }, []);

  return (
    <header className="mb-6 space-y-2">
      {back && (
        <Link
          href={back.href}
          className="-ms-2 inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-sm text-muted hover:bg-surface hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 space-y-1">
          <h1 ref={heading} tabIndex={-1} className="type-page outline-none">
            {title}
          </h1>
          {description && <p className="max-w-prose text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

// A titled box. The heading is an h2: the page's h1 is the PageHeader.
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <Card as="section" aria-labelledby={id} className={cx('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={id} className="type-section">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}

export type FeatureState = 'on' | 'off' | 'setup';

// One feature in a grid: what it is, whether it is on, and the one button that opens it. "Needs
// setup" is the only state drawn as a badge, because it is the only one asking for something.
export function FeatureCard({
  icon: Icon,
  title,
  description,
  state,
  stateNote,
  actionLabel,
  onAction,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  state?: FeatureState; // left out for a feature that is a tool, not a switch
  stateNote?: string; // a short reason shown beside the state: "Publish your page first"
  actionLabel: string;
  onAction?: () => void;
  href?: string;
}) {
  const id = useId();
  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={id} className="font-semibold">
            {title}
          </h3>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm">
          {state === undefined ? null : state === 'setup' ? (
            <Badge tone="warning">Needs setup</Badge>
          ) : state === 'on' ? (
            <>
              <Check aria-hidden="true" className="size-4 text-accent-fg" />
              <span className="font-medium">On</span>
            </>
          ) : (
            <span className="text-muted">Off</span>
          )}
          {stateNote && <span className="text-muted">· {stateNote}</span>}
        </p>
        {href ? (
          <Link href={href} aria-describedby={id} className={buttonStyles({ size: 'sm' })}>
            {actionLabel}
          </Link>
        ) : (
          <Button size="sm" aria-describedby={id} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

// Advanced or rarely edited fields, folded away. The content stays in the page while closed (just
// hidden), so a form inside keeps what was typed and its errors.
export function Collapsible({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="rounded-card border border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-3 rounded-card px-card py-3 text-start hover:bg-surface"
        >
          <span>
            <span className="block font-medium">{title}</span>
            {description && <span className="block text-sm text-muted">{description}</span>}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cx(
              'size-5 shrink-0 text-muted transition-transform motion-reduce:transition-none',
              open && 'rotate-180',
            )}
          />
        </button>
      </h3>
      <div id={id} hidden={!open} className="border-t border-line p-card">
        {children}
      </div>
    </div>
  );
}

// A label with its helper text on one side and the control on the other. Stacks on a narrow screen.
export function SettingRow({
  label,
  helper,
  children,
  htmlFor,
}: {
  label: string;
  helper?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div className="min-w-0 flex-1 basis-64">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium">{label}</p>
        )}
        {helper && <p className="text-sm text-muted">{helper}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// Long help text behind a small button: it works with a keyboard and a finger (hover is not
// needed), and says "expanded" or not to a screen reader.
export function InfoToggle({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-control py-0.5 text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
      >
        <Info aria-hidden="true" className="size-4" />
        {label}
      </button>
      <span id={id} hidden={!open} className="mt-1 block max-w-prose text-sm text-muted">
        {children}
      </span>
    </span>
  );
}
