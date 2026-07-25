-- AlterTable
ALTER TABLE "Animal" ADD COLUMN "isSterilized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "isVaccinated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "isChildFriendly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "isTrained" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "lovesPlay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "lovesWalks" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "acceptsDogs" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "acceptsCats" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "lovesAffection" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Animal" ADD COLUMN "poorlyToleratesShelter" BOOLEAN NOT NULL DEFAULT false;

-- Seed-like variety for existing animals
UPDATE "Animal"
SET
  "isSterilized" = (id % 3) <> 2,
  "isVaccinated" = (id % 4) <> 3,
  "isChildFriendly" = (id % 2) = 0,
  "isTrained" = (id % 5) = 0,
  "lovesPlay" = (id % 3) <> 1,
  "lovesWalks" = (id % 2) = 1,
  "acceptsDogs" = (id % 3) = 0,
  "acceptsCats" = (id % 4) IN (0, 1),
  "lovesAffection" = (id % 2) = 0,
  "poorlyToleratesShelter" = (id % 7) = 0;
