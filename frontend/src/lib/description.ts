// A job or project description is one text field. Lines that start with a list marker ("- ", "* ",
// "• ", "– ", or "1. ") become real bullets, and every other line is a paragraph. Nothing else is
// interpreted, so the text stays plain text for the PDF, the Open Graph image and screen readers.

export type DescriptionPart = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] };

const MARKER = /^\s*(?:[-*•–]|\d{1,2}[.)])\s+(.*\S)\s*$/;

export function parseDescription(text: string): DescriptionPart[] {
  const parts: DescriptionPart[] = [];
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const bullet = MARKER.exec(line);
    if (bullet) {
      const last = parts[parts.length - 1];
      if (last?.kind === 'ul') last.items.push(bullet[1]);
      else parts.push({ kind: 'ul', items: [bullet[1]] });
    } else if (line.trim() !== '') {
      // Each line of plain text stays its own paragraph, as the page and the PDF always drew it.
      parts.push({ kind: 'p', text: line.trim() });
    }
  }
  return parts;
}
