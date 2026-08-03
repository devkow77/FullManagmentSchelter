-- DropForeignKey
ALTER TABLE "AnimalDailyCare" DROP CONSTRAINT IF EXISTS "AnimalDailyCare_fedById_fkey";
ALTER TABLE "AnimalDailyCare" DROP CONSTRAINT IF EXISTS "AnimalDailyCare_wateredById_fkey";
ALTER TABLE "AnimalDailyCare" DROP CONSTRAINT IF EXISTS "AnimalDailyCare_cleanedById_fkey";

-- AlterTable
ALTER TABLE "AnimalDailyCare" DROP COLUMN IF EXISTS "fedById";
ALTER TABLE "AnimalDailyCare" DROP COLUMN IF EXISTS "wateredById";
ALTER TABLE "AnimalDailyCare" DROP COLUMN IF EXISTS "cleanedById";
