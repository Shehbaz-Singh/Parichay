'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Printer } from 'lucide-react';
import { Button, Modal } from '../ui';

// Black on white only, with the highest error correction and a four-module quiet zone: the plainest
// code is the one every phone camera reads. Made in the browser, so the link never leaves the page.
const PNG_SIZE = 1024;

interface Code {
  svg: string;
  png: string; // data URL, PNG_SIZE pixels square
  preview: string; // the SVG as a data URL, for the <img>
}

async function makeCode(url: string, level: 'H' | 'M'): Promise<Code> {
  const QRCode = (await import('qrcode')).default;
  const options = { errorCorrectionLevel: level, margin: 4 } as const;
  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...options, type: 'svg' }),
    QRCode.toDataURL(url, { ...options, width: PNG_SIZE }),
  ]);
  return { svg, png, preview: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` };
}

function save(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

// A QR code for the public link, with downloads, copy and a clean print sheet. Before the page is
// published the link goes nowhere, so it asks for that first instead of showing a code.
export function QrCodeDialog({
  open,
  onClose,
  url,
  slug,
  name,
  published,
  contactCard,
  title = 'QR code for your page',
  description = 'Anyone who points a phone camera at this opens your portfolio. Good for a printed resume, a business card or a slide.',
  fileSuffix = '',
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  slug: string;
  name: string;
  published: boolean;
  // The short vCard text for the alternative code, or null while the contact card is off.
  contactCard?: string | null;
  // Other words and file names, when the code is not for the portfolio (the link-in-bio card).
  title?: string;
  description?: string;
  fileSuffix?: string;
}) {
  // The link is the default. The contact card is an alternative, and only when it is switched on.
  const [kind, setKind] = useState<'link' | 'card'>('link');
  const card = contactCard && kind === 'card' ? contactCard : null;
  const payload = card ?? url;
  const [code, setCode] = useState<Code | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const shown = url.replace(/^https?:\/\//, '');
  const alt = card ? `QR code holding the contact card of ${name}` : `QR code linking to ${url}`;
  const ready = open && published;

  useEffect(() => {
    if (!ready) return;
    let current = true;
    setCode(null);
    setFailed(false);
    // The contact card is long, so it uses the lower error correction (fewer, bigger squares).
    makeCode(payload, card ? 'M' : 'H').then(
      (made) => current && setCode(made),
      () => current && setFailed(true),
    );
    return () => {
      current = false;
    };
  }, [ready, payload, card]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(card ?? url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The link is on screen to select by hand.
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        description={
          published
            ? description
            : 'Your page isn’t published yet, so this link doesn’t go anywhere. Publish it first, then come back for your QR code.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {published && (
              <>
                <Button onClick={copy}>
                  {copied ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Copy aria-hidden="true" className="size-4" />
                  )}
                  {copied ? 'Copied' : card ? 'Copy card text' : 'Copy link'}
                </Button>
                <Button
                  disabled={!code}
                  onClick={() =>
                    code && save(code.png, `${slug}${fileSuffix}${card ? '-contact' : ''}-qr.png`)
                  }
                >
                  <Download aria-hidden="true" className="size-4" />
                  PNG
                  <span className="sr-only"> image, {PNG_SIZE} pixels</span>
                </Button>
                <Button
                  disabled={!code}
                  onClick={() =>
                    code &&
                    save(
                      URL.createObjectURL(new Blob([code.svg], { type: 'image/svg+xml' })),
                      `${slug}${fileSuffix}${card ? '-contact' : ''}-qr.svg`,
                    )
                  }
                >
                  <Download aria-hidden="true" className="size-4" />
                  SVG
                  <span className="sr-only"> image</span>
                </Button>
                <Button variant="primary" disabled={!code} onClick={() => window.print()}>
                  <Printer aria-hidden="true" className="size-4" />
                  Print
                </Button>
              </>
            )}
          </>
        }
      >
        {published && contactCard && (
          <fieldset className="mb-4 space-y-2">
            <legend className="mb-1 text-sm font-medium">What the code holds</legend>
            {(
              [
                ['link', 'A link to my page', 'Easy to scan from a distance. Best for most uses.'],
                [
                  'card',
                  'My contact card',
                  'Name, title, page address and one email, saved straight to contacts.',
                ],
              ] as const
            ).map(([value, label, hint]) => (
              // eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is inside, its text is in the nested spans
              <label key={value} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="qr-kind"
                  className="mt-1 size-4"
                  checked={kind === value}
                  onChange={() => setKind(value)}
                />
                <span>
                  <span className="font-medium">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            ))}
            {card && (
              <p
                role="note"
                className="rounded-control bg-warning-bg px-3 py-2 text-xs text-warning-fg"
              >
                This code holds {card.length} characters, about{' '}
                {Math.round(card.length / url.length)} times as many as your link. The squares are
                smaller and it is harder to scan from far away: print it large, keep the contrast
                high, and test it with a phone before you share it. Your phone number, links and
                photo are not in it.
              </p>
            )}
          </fieldset>
        )}
        {published && (
          <figure className="space-y-2 text-center">
            <div className="mx-auto aspect-square w-full max-w-64 rounded-control border border-line bg-white">
              {code ? (
                <img src={code.preview} alt={alt} className="size-full" />
              ) : (
                <p role="status" className="grid size-full place-items-center text-sm text-muted">
                  {failed
                    ? 'We couldn’t make the code. Close this and try again.'
                    : 'Making your code…'}
                </p>
              )}
            </div>
            <figcaption className="text-sm font-medium break-all">
              {card ? `Contact card of ${name}` : shown}
            </figcaption>
          </figure>
        )}
      </Modal>

      {/* The print sheet: out of sight on screen, and the only thing on the page when printing. */}
      {ready &&
        code &&
        createPortal(
          <div className="qr-print">
            <img src={code.preview} alt={alt} />
            <p className="qr-print-name">{name}</p>
            <p className="qr-print-url">{shown}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
