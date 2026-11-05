import type { Block } from '../blocks';

export * from '../copy';

// "01", "02": the number of a section on the page. Hidden and empty sections have no number, so the
// numbers count what is shown.
export const pad = (n: number) => String(n).padStart(2, '0');

export function numbering(blocks: Pick<Block, 'id'>[]): Map<string, string> {
  return new Map(blocks.map((block, index) => [block.id, pad(index + 1)]));
}
