import { parseDescription } from '@/lib/description';

// The copy helpers every theme shares (first written for the Index theme): the hero's one line, the summary beside the
// intro, the description of a job as bullets, and the numbers of the sections. Only the owner's own text is
// used; nothing is invented.

// A sentence ends at . ! ? or the danda / Arabic marks of the scripts the portfolio supports.
const SENTENCE_END = /(?<=[.!?।۔؟])\s+/;

export const sentences = (text: string) => text.split(SENTENCE_END).filter(Boolean);

function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const window = text.slice(0, max);
  return `${window.slice(0, Math.max(window.lastIndexOf(' '), max / 2))}…`;
}

// The first sentence of the About text, for the hero's one line. Null when there is no About text.
export function heroLine(about: string | null | undefined, max = 140): string | null {
  const text = about?.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return cutAtWord(sentences(text)[0] ?? text, max);
}

// The hero's line and what is left of the text after it: the first sentence, when it fits, so the intro below
// does not say it again. A first sentence that is too long is cut for the hero and the text is left whole.
export function heroSplit(
  text: string | null | undefined,
  max = 140,
): { line: string | null; rest: string } {
  const raw = text?.trim();
  if (!raw) return { line: null, rest: '' };
  const match = /^([\s\S]+?[.!?।۔؟])(?:\s+|$)/.exec(raw);
  const first = (match ? match[1] : raw).replace(/\s+/g, ' ');
  if (match && first.length <= max) return { line: first, rest: raw.slice(match[0].length).trim() };
  return { line: cutAtWord(first, max), rest: raw };
}

// The About text in its three places: the hero's line, the summary beside the intro and what is left for the
// About section.
export function introParts(text: string | null | undefined) {
  const { line, rest } = heroSplit(text);
  return { line, ...splitSummary(rest) };
}

// The About text split into the summary beside the intro and what is left for the About section. The summary
// is whole paragraphs up to about `max` characters (or the first sentences of a long first paragraph); the
// rest is the text from there on, so nothing is said twice.
export function splitSummary(text: string, max = 460): { summary: string; rest: string } {
  const paragraphs = text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return { summary: '', rest: '' };
  let summary = '';
  let used = 0;
  for (const paragraph of paragraphs) {
    if (used > 0 && summary.length + paragraph.length > max) break;
    if (used === 0 && paragraph.length > max) {
      // One long first paragraph: whole sentences up to the limit.
      let taken = '';
      for (const sentence of sentences(paragraph)) {
        if (taken && taken.length + sentence.length + 1 > max) break;
        taken = taken ? `${taken} ${sentence}` : sentence;
      }
      summary = taken || cutAtWord(paragraph, max);
      const remainder = paragraph.slice(summary.length).trim();
      return {
        summary,
        rest: [remainder, ...paragraphs.slice(1)].filter(Boolean).join('\n\n'),
      };
    }
    summary = summary ? `${summary}\n\n${paragraph}` : paragraph;
    used += 1;
  }
  return { summary, rest: paragraphs.slice(used).join('\n\n') };
}

// How large the name is set, by its length: a 60-character name must still sit in a few lines.
export function nameScale(name: string): 'xl' | 'l' | 'm' | 's' {
  const length = Array.from(name).length;
  if (length <= 16) return 'xl';
  if (length <= 28) return 'l';
  if (length <= 44) return 'm';
  return 's';
}

export const HERO_NAME: Record<ReturnType<typeof nameScale>, string> = {
  xl: 'text-[clamp(2.75rem,7vw,6rem)]',
  l: 'text-[clamp(2.4rem,5.4vw,4.75rem)]',
  m: 'text-[clamp(2.1rem,4.2vw,3.75rem)]',
  s: 'text-[clamp(1.85rem,3.2vw,2.9rem)]',
};
export const GIANT_NAME: Record<ReturnType<typeof nameScale>, string> = {
  xl: 'text-[clamp(3rem,9.5vw,8.5rem)]',
  l: 'text-[clamp(2.75rem,7vw,6.5rem)]',
  m: 'text-[clamp(2.25rem,5vw,4.5rem)]',
  s: 'text-[clamp(1.9rem,3.6vw,3.25rem)]',
};

// A job's description as bullets. Lines the owner marked as a list stay a list; several plain lines become
// one; one long paragraph of several sentences is split into a bullet per sentence. A short single line is
// left as a line. Paragraphs between lists are kept as paragraphs.
export type Piece = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] };

export function bulletsOf(text: string): Piece[] {
  const parts = parseDescription(text);
  if (parts.some((part) => part.kind === 'ul')) return parts;
  const lines = parts.flatMap((part) => (part.kind === 'p' ? [part.text] : []));
  if (lines.length > 1) return [{ kind: 'ul', items: lines }];
  const single = lines[0];
  if (!single) return [];
  const each = sentences(single);
  if (each.length >= 2 && single.length > 160) return [{ kind: 'ul', items: each }];
  return [{ kind: 'p', text: single }];
}
