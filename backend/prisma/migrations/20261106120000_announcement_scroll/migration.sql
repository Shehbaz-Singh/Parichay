-- AlterTable: the announcement text can scroll along the bar; off for every profile
ALTER TABLE "Profile" ADD COLUMN     "announcementScroll" BOOLEAN NOT NULL DEFAULT false;
