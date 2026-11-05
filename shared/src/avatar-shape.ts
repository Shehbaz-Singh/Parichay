import { z } from 'zod';

// The shape of the owner's photo on the public page. With none chosen (null) each theme draws it
// the way its design does; a choice here overrides that in every theme.
export const AVATAR_SHAPES = ['round', 'soft', 'square'] as const;
export const avatarShapeSchema = z.enum(AVATAR_SHAPES);
export type AvatarShape = z.infer<typeof avatarShapeSchema>;
