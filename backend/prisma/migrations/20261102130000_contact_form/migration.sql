-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('new', 'read', 'archived');

-- AlterTable: the contact form starts switched off for every profile
ALTER TABLE "Profile" ADD COLUMN     "contactFormEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactFormIntro" VARCHAR(140),
ALTER COLUMN "sectionConfig" SET DEFAULT '[{"key":"about","visible":true},{"key":"skills","visible":true},{"key":"experience","visible":true},{"key":"projects","visible":true},{"key":"education","visible":true},{"key":"testimonials","visible":false},{"key":"writing","visible":false},{"key":"contact","visible":false}]';

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "senderName" VARCHAR(80) NOT NULL,
    "senderEmail" VARCHAR(254) NOT NULL,
    "subject" VARCHAR(120),
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactMessage_profileId_status_createdAt_idx" ON "ContactMessage"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing profiles get the new section, hidden, after the others.
UPDATE "Profile"
SET "sectionConfig" = "sectionConfig" || '[{"key":"contact","visible":false}]'::jsonb
WHERE NOT ("sectionConfig" @> '[{"key":"contact"}]'::jsonb);
