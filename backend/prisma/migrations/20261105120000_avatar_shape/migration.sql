-- CreateEnum
CREATE TYPE "AvatarShape" AS ENUM ('round', 'soft', 'square');

-- AlterTable: null keeps today's behaviour, each theme draws the photo in its own shape
ALTER TABLE "Profile" ADD COLUMN     "avatarShape" "AvatarShape";
