-- AlterTable: each project gets an address of its own (see schema.prisma). Existing projects get one
-- made from their name, a counter added when a profile has two with the same name; a name with no
-- letters or digits becomes "project".
ALTER TABLE "Project" ADD COLUMN     "slug" TEXT;

WITH base AS (
  SELECT id, "profileId",
    COALESCE(NULLIF(trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'project') AS b
  FROM "Project"
), ranked AS (
  SELECT id, b, row_number() OVER (PARTITION BY "profileId", b ORDER BY id) AS n FROM base
)
UPDATE "Project" p
SET slug = CASE WHEN r.n = 1 THEN left(r.b, 60) ELSE left(r.b, 60) || '-' || r.n END
FROM ranked r
WHERE p.id = r.id;

ALTER TABLE "Project" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_profileId_slug_key" ON "Project"("profileId", "slug");
