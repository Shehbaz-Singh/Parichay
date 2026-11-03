import { z } from 'zod';
import { DELETE_CONFIRMATION } from './legal';
import { FULL_NAME_MAX, profileSchema } from './portfolio';
import { EMAIL_MAX } from './text';
import { VALIDATION } from './messages';

// bcrypt only uses the first 72 bytes of a password, so reject anything longer instead of
// silently truncating it.
const passwordSchema = z
  .string()
  .min(8, VALIDATION.passwordShort)
  .refine((p) => new TextEncoder().encode(p).length <= 72, VALIDATION.passwordBytes);

const emailSchema = z.string().trim().toLowerCase().email().max(EMAIL_MAX);

// Sign-in and the password forms take any password up to this, so an old, longer one still works.
const PASSWORD_INPUT_MAX = 1024;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  // Optional: defaults to the part of the email before the @.
  fullName: z.string().trim().min(1).max(FULL_NAME_MAX).optional(),
  // Must be true: the box on the sign-up form. The API records when and which version.
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: VALIDATION.termsRequired }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // No strength rules on login, so changing the policy never locks existing users out.
  password: z.string().min(1, VALIDATION.passwordRequired).max(PASSWORD_INPUT_MAX),
});
export type LoginInput = z.infer<typeof loginSchema>;

// POST /auth/change-password
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION.currentPasswordRequired).max(PASSWORD_INPUT_MAX),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: VALIDATION.passwordReused,
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// DELETE /auth/me: the password and the typed word are the confirmation, so neither a stolen session
// nor a stray click can do it.
export const deleteAccountSchema = z.object({
  password: z.string().min(1, VALIDATION.passwordRequired).max(PASSWORD_INPUT_MAX),
  confirmation: z
    .string()
    .trim()
    .refine(
      (v) => v === DELETE_CONFIRMATION,
      `Type ${DELETE_CONFIRMATION} in capital letters to confirm`,
    ),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// ---- Responses ----

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

export const sessionResponseSchema = z.object({
  user: authUserSchema,
  profile: profileSchema.nullable(),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const authResponseSchema = sessionResponseSchema.extend({
  token: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
