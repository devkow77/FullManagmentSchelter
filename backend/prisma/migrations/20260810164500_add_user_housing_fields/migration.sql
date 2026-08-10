-- AlterEnum
CREATE TYPE "HousingType" AS ENUM ('DOM', 'MIESZKANIE', 'INNE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "housingType" "HousingType",
ADD COLUMN "hasGardenOrBalcony" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "livingConditions" TEXT;
