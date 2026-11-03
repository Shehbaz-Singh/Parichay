'use client';

import type { CSSProperties } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { ShareButton } from '../ShareButton';
import { useCopy } from '@/lib/hooks';
import { Button, Modal, buttonStyles } from '../ui';

// Small pieces falling once. Their spread is fixed (not random) so it renders the same everywhere.
// Hidden for people who ask for less motion (see .confetti in globals.css); the message carries the
// moment on its own.
const PIECES = Array.from({ length: 22 }, (_, i) => ({
  x: `${(i * 37) % 100}%`,
  delay: `${((i * 53) % 70) / 100}s`,
  rotate: `${((i * 97) % 360) - 180}deg`,
  tone: i % 3,
}));

// Shown the first time a page goes live: a friendly note and the ways to tell people about it.
export function PublishCelebration({
  open,
  onClose,
  url,
  slug,
  name,
  message,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  slug: string;
  name: string;
  message: string | null;
  subject: string;
}) {
  const { copied, copy } = useCopy();
  const shown = url.replace(/^https?:\/\//, '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="You’re live!"
      description="Your portfolio is out in the world. Send the link to a friend, add it to your resume or put it in your email signature."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Back to editing
          </Button>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: 'primary' })}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            See your page
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      }
    >
      {open && (
        <div aria-hidden="true" className="confetti">
          {PIECES.map((piece, i) => (
            <span
              key={i}
              data-tone={piece.tone}
              style={{ '--x': piece.x, '--d': piece.delay, '--r': piece.rotate } as CSSProperties}
            />
          ))}
        </div>
      )}
      <div className="space-y-3">
        <p className="rounded-control bg-surface px-3 py-2 text-sm font-medium break-all">
          {shown}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void copy(url)}>
            {copied ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <ShareButton
            url={url}
            title={`${name}’s portfolio`}
            message={message}
            subject={subject}
            variant="outline"
          />
        </div>
      </div>
    </Modal>
  );
}
