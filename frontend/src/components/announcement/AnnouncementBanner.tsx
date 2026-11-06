'use client';

import { createContext, useContext, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import type { PublicAnnouncement } from '@parichay/shared';
import { dismiss, isDismissed, prePaintScript, subscribe } from '@/lib/announcement-dismissal';

// The announcement bar of a public page: one slim line above the page, in the theme's colors (the --ann-*
// variables of lib/palette, the rules in app/announcement.css). It is drawn on the server, so it is there
// with JavaScript off (it just cannot be closed); a small script right after it hides it before the first
// paint when the visitor has closed this version. It scrolls away with the page, announces nothing by
// itself (no live region), and its motion is one short slide-down on arrival, and the text scrolling when the owner chose that (see the CSS).

export interface AnnouncementWords {
  dismiss: string; // the close button's name
  learnMore: string; // the link's text when the owner chose none
  pause: string; // the scrolling bar's pause button
  resume: string; // and its play button
}

// The dashboard's preview draws the bar as it is, whatever this browser has closed, and never saves a closing.
const PreviewContext = createContext(false);
export const AnnouncementPreview = PreviewContext.Provider;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

// The first thing a visitor can tab to after the bar, so closing it does not send them back to the top of
// the page. Nothing there: focus is left where it is.
function nextFocusable(bar: HTMLElement): HTMLElement | null {
  for (const candidate of document.querySelectorAll<HTMLElement>(FOCUSABLE)) {
    const after = bar.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING;
    if (!after || bar.contains(candidate) || candidate.closest('[inert]')) continue;
    if (candidate.getClientRects().length === 0) continue;
    return candidate;
  }
  return null;
}

const noSubscription = () => () => {};

// Seconds for one pass of the text: slow enough to read (about 35 to 90 pixels a second), longer for longer text.
const duration = (text: string, linkUrl: string | null) =>
  Math.max(16, Math.round(8 + (text.length + (linkUrl ? 12 : 0)) * 0.18));

function Message({
  text,
  linkUrl,
  label,
  copy = false,
}: {
  text: string;
  linkUrl: string | null;
  label: string;
  copy?: boolean;
}) {
  return (
    <p className="ann-text ann-copy" aria-hidden={copy || undefined} inert={copy || undefined}>
      {text}
      {linkUrl && (
        <>
          {' '}
          <a className="ann-link" href={linkUrl} rel="noopener noreferrer">
            {label}
          </a>
        </>
      )}
    </p>
  );
}

export function AnnouncementBanner({
  announcement,
  slug,
  words,
}: {
  announcement: PublicAnnouncement;
  slug: string;
  words: AnnouncementWords;
}) {
  const preview = useContext(PreviewContext);
  const bar = useRef<HTMLElement>(null);
  const { text, linkUrl, linkLabel, style, dismissible, scroll, version, endsAt } = announcement;
  // Scrolling can be stopped (and hovering or focusing the bar stops it too). Whether it moves at all
  // depends on the visitor: see the motion rules in announcement.css.
  const [paused, setPaused] = useState(false);

  // Closed on this device, or past its end (a page cached just before the end). The server and the first
  // client render say "no", so they match the HTML; the script below has already hidden the bar if not.
  const closed = useSyncExternalStore(
    preview ? noSubscription : subscribe,
    () =>
      !preview && (isDismissed(slug, version) || (!!endsAt && Date.parse(endsAt) <= Date.now())),
    () => false,
  );
  // The script is for the server's HTML and the hydration that follows. When the visitor moves to another
  // page without a reload React draws this on the client, where a script never runs, and it is left out.
  const first = useSyncExternalStore(
    noSubscription,
    () => false,
    () => true,
  );
  if (closed) return null;

  function close() {
    const bring = bar.current ? nextFocusable(bar.current) : null;
    // Focus moves first: the button that has it is about to leave the page.
    bring?.focus({ preventScroll: true });
    if (!preview) dismiss(slug, version);
  }

  return (
    <>
      {/* suppressHydrationWarning: the script below may have set `hidden` before React took over. */}
      <section
        ref={bar}
        className="ann"
        data-style={style}
        data-scroll={scroll ? '' : undefined}
        data-paused={paused ? '' : undefined}
        style={
          scroll
            ? ({ '--ann-duration': `${duration(text, linkUrl)}s` } as CSSProperties)
            : undefined
        }
        suppressHydrationWarning
      >
        <div className="ann-inner">
          <div className="ann-viewport">
            <div className="ann-track">
              <Message text={text} linkUrl={linkUrl} label={linkLabel || words.learnMore} />
              {/* The second copy is what makes the loop seamless; it is hidden from assistive technology
                  and cannot be tabbed to, and it is not drawn at all when the text does not scroll. */}
              {scroll && (
                <Message text={text} linkUrl={linkUrl} label={linkLabel || words.learnMore} copy />
              )}
            </div>
          </div>
          {scroll && !first && (
            <button
              type="button"
              className="ann-pause"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? words.resume : words.pause}
            >
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                {paused ? (
                  <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
                ) : (
                  <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />
                )}
              </svg>
            </button>
          )}
          {dismissible && (
            <button type="button" className="ann-close" onClick={close} aria-label={words.dismiss}>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </section>
      {first && (
        <script dangerouslySetInnerHTML={{ __html: prePaintScript(slug, version, endsAt) }} />
      )}
    </>
  );
}
