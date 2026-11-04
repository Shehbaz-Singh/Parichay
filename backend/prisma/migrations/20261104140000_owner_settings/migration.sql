-- CreateEnum
CREATE TYPE "LeadWith" AS ENUM ('automatic', 'experience', 'work', 'education');

-- CreateEnum
CREATE TYPE "PortfolioAppearance" AS ENUM ('dark', 'light');

-- CreateEnum
CREATE TYPE "TestimonialStyle" AS ENUM ('list', 'carousel');

-- AlterTable: every existing profile keeps today's behaviour (automatic lead, dark Aurora, list testimonials)
ALTER TABLE "Profile" ADD COLUMN     "leadWith" "LeadWith" NOT NULL DEFAULT 'automatic',
ADD COLUMN     "appearance" "PortfolioAppearance" NOT NULL DEFAULT 'dark',
ADD COLUMN     "testimonialStyle" "TestimonialStyle" NOT NULL DEFAULT 'list';

-- AlterTable: a project may name the job it was built during
ALTER TABLE "Project" ADD COLUMN     "experienceId" TEXT;

-- CreateIndex
CREATE INDEX "Project_experienceId_idx" ON "Project"("experienceId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;
