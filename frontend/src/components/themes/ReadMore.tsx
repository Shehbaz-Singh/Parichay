import { uiFor } from '@/lib/i18n';
import { ClampedText } from './Collapse';

// Texts shorter than this fit in a few lines anyway, so they are drawn as they are.
const LONG = 280;

// A description that is cut to a few lines when it is long, with "Read more". `className` is the
// theme's paragraph style.
export function ReadMore({
  text,
  locale,
  className,
  lines = 4,
  from = LONG,
}: {
  text: string;
  locale: string;
  className?: string;
  lines?: number;
  from?: number; // the length from which it is cut
}) {
  if (text.length < from) return <p className={`whitespace-pre-line ${className ?? ''}`}>{text}</p>;
  const { readMore, readLess } = uiFor(locale).density;
  return (
    <ClampedText
      text={text}
      className={`whitespace-pre-line ${className ?? ''}`}
      more={readMore}
      less={readLess}
      lines={lines}
    />
  );
}
