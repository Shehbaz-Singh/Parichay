import {
  LEGAL_VERSION,
  type AuthResponse,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  SessionResponse,
  readWorkingHours,
  ERROR_CODES,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { signToken } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import { prisma } from '../lib/prisma';
import { isUniqueViolation } from '../lib/prisma-errors';
import { profileSelect } from '../lib/selects';
import { deleteAllImagesOf } from './avatar.service';
import { generateUniqueSlug } from './slug.service';
import { ERRORS } from '../lib/messages';

// Explicit selects mean passwordHash is never loaded unless login needs it, and the
// session builder below copies fields by name so it can never leak into a response.
const sessionSelect = {
  id: true,
  email: true,
  createdAt: true,
  profile: { select: profileSelect },
} satisfies Prisma.UserSelect;

type SessionUser = Prisma.UserGetPayload<{ select: typeof sessionSelect }>;

function toSession(user: SessionUser): SessionResponse {
  return {
    user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
    profile: user.profile && {
      ...user.profile,
      workingHours: readWorkingHours(user.profile.workingHours),
      // JSON has no dates: the session says them as ISO strings, as the editor reads them.
      announcementStartsAt: user.profile.announcementStartsAt?.toISOString() ?? null,
      announcementEndsAt: user.profile.announcementEndsAt?.toISOString() ?? null,
    },
  };
}

const emailTaken = () => AppError.conflict(ERROR_CODES.EMAIL_TAKEN, ERRORS.emailTaken);

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password } = input;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw emailTaken();
  }

  const passwordHash = await hashPassword(password);
  const fullName = input.fullName ?? email.split('@')[0];

  // The checks above are not atomic with the insert, so two concurrent requests can still
  // collide. The unique constraints are the real guard: on a violation, work out which one.
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await generateUniqueSlug(fullName);
    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          termsAcceptedAt: new Date(),
          termsVersion: LEGAL_VERSION,
          profile: { create: { slug, fullName } },
        },
        select: sessionSelect,
      });
      return { token: signToken(user.id), ...toSession(user) };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        throw emailTaken();
      }
      // Otherwise the slug was taken in the meantime: retry with a new one.
    }
  }
  throw new Error('Could not create account after several attempts');
}

export async function login({ email, password }: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...sessionSelect, passwordHash: true },
  });

  // Same error and same amount of work whether the email or the password was wrong.
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !valid) {
    throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, ERRORS.invalidCredentials);
  }

  return { token: signToken(user.id), ...toSession(user) };
}

export async function getSession(userId: string): Promise<SessionResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: sessionSelect });
  if (!user) throw AppError.unauthorized(ERRORS.accountGone, 'INVALID_TOKEN');
  return toSession(user);
}

// Changing or deleting an account needs the password again, even with a valid token. The error
// is 403, not 401: the session is fine, and the frontend treats a 401 as "log in again".
async function confirmPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, profile: { select: { id: true, avatarUrl: true } } },
  });
  if (!user) throw AppError.unauthorized(ERRORS.accountGone, 'INVALID_TOKEN');
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(403, ERROR_CODES.INVALID_PASSWORD, ERRORS.incorrectPassword);
  }
  return user;
}

// Tokens are not tied to the password, so other signed-in devices stay signed in until their
// token expires. Doing better would need a token version on the user.
export async function changePassword(userId: string, input: ChangePasswordInput) {
  await confirmPassword(userId, input.currentPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
}

// Removes the account and everything under it in one transaction, so it is all gone or nothing is.
// The cascade on the foreign keys would do the same; the explicit deletes keep this true if a
// table is ever added without one. There are no session rows: a login is a signed token, and once
// the user is gone every token for them is refused. The photo is removed from Cloudinary after the
// commit; a failure there only leaves an unused image behind. The page returns 404 from the moment
// the commit lands, and the frontend drops its cached copies (see the /api proxy).
export async function deleteAccount(userId: string, { password }: DeleteAccountInput) {
  const user = await confirmPassword(userId, password);
  const profileId = user.profile?.id;
  await prisma.$transaction([
    ...(profileId
      ? [
          prisma.customSectionItem.deleteMany({ where: { section: { profileId } } }),
          prisma.customSection.deleteMany({ where: { profileId } }),
          prisma.customPage.deleteMany({ where: { profileId } }),
          prisma.testimonial.deleteMany({ where: { profileId } }),
          prisma.post.deleteMany({ where: { profileId } }),
          prisma.link.deleteMany({ where: { profileId } }),
          prisma.skill.deleteMany({ where: { profileId } }),
          prisma.experience.deleteMany({ where: { profileId } }),
          prisma.projectImage.deleteMany({ where: { project: { profileId } } }),
          prisma.project.deleteMany({ where: { profileId } }),
          prisma.education.deleteMany({ where: { profileId } }),
          prisma.profile.delete({ where: { id: profileId } }),
        ]
      : []),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  if (user.profile) await deleteAllImagesOf(user.profile.avatarUrl, user.profile.id);
}
