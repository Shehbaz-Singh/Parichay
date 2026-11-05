-- New profiles use the Index theme. A default only: existing rows keep their saved theme.
ALTER TABLE "Profile" ALTER COLUMN "theme" SET DEFAULT 'index';
