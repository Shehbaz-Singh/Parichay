-- CreateEnum
CREATE TYPE "LayoutMode" AS ENUM ('single', 'multi');

-- AlterTable: every profile starts as one page, with no page settings (the defaults apply)
ALTER TABLE "Profile" ADD COLUMN     "layoutMode" "LayoutMode" NOT NULL DEFAULT 'single',
ADD COLUMN     "pageConfig" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "sitemapListed" BOOLEAN NOT NULL DEFAULT false;

-- Until now a profile with a lot on it was split into pages automatically (more than 6 projects,
-- 5 jobs or 12 skills among the sections it shows). Those profiles keep exactly that: multi mode, the
-- same pages, and no Contact page (the contact form stays on the home page, as before).
UPDATE "Profile" p
SET "layoutMode" = 'multi',
    "pageConfig" = '[{"key":"home","visible":true,"sections":[]},{"key":"work","visible":true,"sections":[]},{"key":"about","visible":true,"sections":[]},{"key":"writing","visible":true,"sections":[]},{"key":"contact","visible":false,"sections":[]}]'::jsonb
WHERE
  (
    NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p."sectionConfig") e WHERE e->>'key' = 'projects' AND e->>'visible' = 'false')
    AND (SELECT count(*) FROM "Project" x WHERE x."profileId" = p."id") > 6
  )
  OR (
    NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p."sectionConfig") e WHERE e->>'key' = 'experience' AND e->>'visible' = 'false')
    AND (SELECT count(*) FROM "Experience" x WHERE x."profileId" = p."id") > 5
  )
  OR (
    NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p."sectionConfig") e WHERE e->>'key' = 'skills' AND e->>'visible' = 'false')
    AND (SELECT count(*) FROM "Skill" x WHERE x."profileId" = p."id") > 12
  );

-- CreateTable
CREATE TABLE "CustomPage" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "slug" VARCHAR(30) NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomPage_profileId_idx" ON "CustomPage"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomPage_profileId_slug_key" ON "CustomPage"("profileId", "slug");

-- AddForeignKey
ALTER TABLE "CustomPage" ADD CONSTRAINT "CustomPage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
