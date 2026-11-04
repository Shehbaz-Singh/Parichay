'use client';

import { useEffect, useId, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { fill } from '@/lib/i18n';

export interface Quote {
  id: string;
  message: string;
  name: string;
  detail: string | null;
}

// Testimonials, one large quote at a time. Without JavaScript (and until the page has loaded) they are
// a plain list of all of them. With it, the others are put away and two labeled buttons step through;
// nothing advances by itself, and the quote that comes up is announced politely. The buttons are
// native, so Enter and Space work, and the arrows mirror in right-to-left languages.
export function Quotes({
  quotes,
  labels,
  quoteClassName = 'pt-h3 font-normal',
}: {
  quotes: Quote[];
  labels: { prev: string; next: string; position: string };
  quoteClassName?: string; // the size of the quote text
}) {
  const id = useId();
  const [enhanced, setEnhanced] = useState(false);
  const [index, setIndex] = useState(0);
  useEffect(() => setEnhanced(true), []);
  const total = quotes.length;
  const step = (by: number) => setIndex((index + by + total) % total);
  const button =
    'inline-flex size-12 items-center justify-center border-2 border-current hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current print:hidden';

  return (
    <div>
      <ul
        id={id}
        aria-live={enhanced ? 'polite' : undefined}
        aria-atomic={enhanced ? 'true' : undefined}
        className="space-y-12"
      >
        {quotes.map((quote, i) => (
          <li key={quote.id} hidden={enhanced && i !== index} className="min-w-0">
            <figure>
              <blockquote
                className={`sb-tight ${quoteClassName} text-pretty whitespace-pre-line [overflow-wrap:anywhere]`}
              >
                {quote.message}
              </blockquote>
              <figcaption className="mt-6 pt-body">
                <span className="font-bold">{quote.name}</span>
                {quote.detail && <span className="block opacity-90">{quote.detail}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {enhanced && total > 1 && (
        <div className="mt-8 flex items-center gap-3">
          <button type="button" aria-controls={id} onClick={() => step(-1)} className={button}>
            <ArrowLeft aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            <span className="sr-only">{labels.prev}</span>
          </button>
          <button type="button" aria-controls={id} onClick={() => step(1)} className={button}>
            <ArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            <span className="sr-only">{labels.next}</span>
          </button>
          <span className="ms-2 pt-small tabular-nums">
            {fill(labels.position, { n: index + 1, total })}
          </span>
        </div>
      )}
    </div>
  );
}
