import { z } from 'zod';

// Every error response from the API has this shape.
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

// The error codes the dashboard acts on, so it compares against these and not against typed
// strings. The API's other codes are only shown through their messages.
export const ERROR_CODES = {
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  SLUG_TAKEN: 'SLUG_TAKEN',
  NOT_FOUND: 'NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  RESUME_IMPORT_UNAVAILABLE: 'RESUME_IMPORT_UNAVAILABLE',
  SUGGESTIONS_UNAVAILABLE: 'SUGGESTIONS_UNAVAILABLE',
  SUGGESTION_LIMIT: 'SUGGESTION_LIMIT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  RATE_LIMITED: 'RATE_LIMITED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  NOTHING_FOUND: 'NOTHING_FOUND',
} as const;
