import { parseDescription } from '@/lib/description';
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
  const parts = parseDescription(text);
  // Bullets are drawn whole as a real list: cutting a list mid-way hides the achievements.
  if (parts.some((part) => part.kind === 'ul')) {
    return (
      <div className={`max-w-[68ch] space-y-2 ${className ?? ''}`}>
        {parts.map((part, i) =>
          part.kind === 'p' ? (
            <p key={i}>{part.text}</p>
          ) : (
            <ul key={i} className="list-disc space-y-1 ps-5 marker:text-muted">
              {part.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          ),
        )}
      </div>
    );
  }
  if (text.length < from)
    return <p className={`max-w-[68ch] whitespace-pre-line ${className ?? ''}`}>{text}</p>;
  const { readMore, readLess } = uiFor(locale).density;
  return (
    <ClampedText
      text={text}
      className={`max-w-[68ch] whitespace-pre-line ${className ?? ''}`}
      more={readMore}
      less={readLess}
      lines={lines}
    />
  );
}
