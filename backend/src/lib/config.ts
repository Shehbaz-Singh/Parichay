import 'dotenv/config';
import { z } from 'zod';
import { CONTACT_DEFAULT_RETENTION_DAYS } from '@parichay/shared';

const optionalText = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // Number + unit, e.g. 30m, 12h, 7d.
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 30m, 12h or 7d')
    .default('7d'),
  // Shared with the Next.js server (same name in frontend/.env.local). Lets it vouch for the
  // real client IP it forwards, so rate limits apply per user instead of per frontend server.
  PROXY_SECRET: z.string().min(32, 'PROXY_SECRET must be at least 32 characters').optional(),
  // Resume import. Without LLM_API_KEY the feature reports itself unavailable; nothing else
  // changes. A line left empty in .env counts as not set.
  LLM_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  LLM_API_KEY: optionalText(),
  LLM_MODEL: optionalText(), // each provider has a default
  LLM_BASE_URL: optionalText().pipe(z.string().url().optional()), // for OpenAI-compatible servers
  // Contact form. Messages older than this many days are deleted by a scheduled sweep.
  CONTACT_RETENTION_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3650)
    .default(CONTACT_DEFAULT_RETENTION_DAYS),
  // Cloudflare Turnstile, a privacy-friendly CAPTCHA for the contact form. It switches on only when
  // both keys are set; the privacy policy then names it.
  TURNSTILE_SITE_KEY: optionalText(),
  TURNSTILE_SECRET_KEY: optionalText(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

// Turnstile is on only with both keys.
export const turnstile =
  config.TURNSTILE_SITE_KEY && config.TURNSTILE_SECRET_KEY
    ? { siteKey: config.TURNSTILE_SITE_KEY, secretKey: config.TURNSTILE_SECRET_KEY }
    : null;
