-- CreateEnum
CREATE TYPE "AnnouncementStyle" AS ENUM ('info', 'highlight', 'notice');

-- AlterTable: the announcement bar starts switched off for every profile. The dates are UTC instants.
ALTER TABLE "Profile" ADD COLUMN     "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "announcementText" VARCHAR(140),
ADD COLUMN     "announcementLinkUrl" VARCHAR(2048),
ADD COLUMN     "announcementLinkLabel" VARCHAR(30),
ADD COLUMN     "announcementStyle" "AnnouncementStyle" NOT NULL DEFAULT 'info',
ADD COLUMN     "announcementStartsAt" TIMESTAMP(3),
ADD COLUMN     "announcementEndsAt" TIMESTAMP(3),
ADD COLUMN     "announcementDismissible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "announcementVersion" INTEGER NOT NULL DEFAULT 1;
