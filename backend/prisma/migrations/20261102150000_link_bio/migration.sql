-- CreateEnum
CREATE TYPE "LinkBioStyle" AS ENUM ('light', 'soft');

-- AlterEnum: the labels of the link-in-bio buttons can be translated
ALTER TYPE "TranslatableEntity" ADD VALUE 'linkBioLink';

-- AlterTable: the link-in-bio card starts switched off for every profile, with every optional
-- button allowed (each one still needs its own feature to be on)
ALTER TABLE "Profile" ADD COLUMN     "linkBioEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkBioStyle" "LinkBioStyle" NOT NULL DEFAULT 'light',
ADD COLUMN     "linkBioShowContact" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linkBioShowVcard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linkBioShowResume" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linkBioShowShare" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linkBioShowWork" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "LinkBioLink" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "label" VARCHAR(40) NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LinkBioLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkBioLink_profileId_idx" ON "LinkBioLink"("profileId");

-- AddForeignKey
ALTER TABLE "LinkBioLink" ADD CONSTRAINT "LinkBioLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
