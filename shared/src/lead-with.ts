import { z } from 'zod';

// What the public page leads with after the introduction (and the summary). Automatic means Experience
// when the profile has jobs, otherwise Selected work, otherwise Education.
export const LEAD_WITH = ['automatic', 'experience', 'work', 'education'] as const;
export const leadWithSchema = z.enum(LEAD_WITH);
export type LeadWith = z.infer<typeof leadWithSchema>;
export const DEFAULT_LEAD_WITH: LeadWith = 'automatic';

// Aurora's look. The other themes have one look and ignore it.
export const APPEARANCES = ['dark', 'light'] as const;
export const appearanceSchema = z.enum(APPEARANCES);
export type Appearance = z.infer<typeof appearanceSchema>;
export const DEFAULT_APPEARANCE: Appearance = 'dark';

// Testimonials on the Sidebar theme: a plain list, or a carousel that never advances by itself.
export const TESTIMONIAL_STYLES = ['list', 'carousel'] as const;
export const testimonialStyleSchema = z.enum(TESTIMONIAL_STYLES);
export type TestimonialStyle = z.infer<typeof testimonialStyleSchema>;
export const DEFAULT_TESTIMONIAL_STYLE: TestimonialStyle = 'list';
