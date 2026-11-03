-- AlterTable: the owner can feature projects, which lead the public page (none are featured to start)
ALTER TABLE "Project" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
