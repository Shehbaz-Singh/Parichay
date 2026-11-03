import { z } from 'zod';

// One page, or a site of pages (see pages.ts). Its own file because portfolio.ts needs it and
// pages.ts needs portfolio.ts's neighbours: this keeps the imports from going in a circle.
export const LAYOUT_MODES = ['single', 'multi'] as const;
export const layoutModeSchema = z.enum(LAYOUT_MODES);
export type LayoutMode = z.infer<typeof layoutModeSchema>;
export const DEFAULT_LAYOUT_MODE: LayoutMode = 'single';
