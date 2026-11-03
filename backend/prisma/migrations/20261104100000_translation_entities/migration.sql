-- AlterEnum: page names, custom pages and project image alt text can be translated. The values are
-- added in a migration of their own because a new enum value cannot be used in the transaction that adds it.
ALTER TYPE "TranslatableEntity" ADD VALUE 'page';
ALTER TYPE "TranslatableEntity" ADD VALUE 'customPage';
ALTER TYPE "TranslatableEntity" ADD VALUE 'projectImage';
