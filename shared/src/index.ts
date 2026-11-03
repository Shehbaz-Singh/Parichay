import { z } from 'zod';

// Shared Zod schemas and types live here. Feature schemas get added per task.

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export * from './messages';
export * from './uploads';
export * from './availability';
export * from './languages';
export * from './legal';
export * from './translations';
export * from './work-card';
export * from './share';
export * from './vcard';
export * from './contact-card';
export * from './portfolio';
export * from './public';
export * from './section-config';
export * from './layout-mode';
export * from './pages';
export * from './custom-sections';
export * from './posts';
export * from './samples';
export * from './testimonials';
export * from './contact';
export * from './link-bio';
export * from './link-card';
export * from './auth';
export * from './errors';

export * from './resume';
