import type { AvatarShape } from '@parichay/shared';

// The classes of the owner's chosen photo shape (shared/src/avatar-shape.ts), used by every theme
// and by the dashboard's previews so they cannot disagree.
export const AVATAR_SHAPE_CLASS: Record<AvatarShape, string> = {
  round: 'rounded-full',
  soft: 'rounded-[22%]',
  square: 'rounded-none',
};

// A theme's class list without its own rounding (also the ones that apply at one width, like
// sm:rounded-2xl), so the owner's shape is the only one left.
export const withoutRounding = (className: string) =>
  className.replace(/(?:^|\s)(?:[\w-]+:)*rounded(?:-\S+)?(?=\s|$)/g, '').trim();
