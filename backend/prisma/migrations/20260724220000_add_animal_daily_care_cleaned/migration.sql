-- AlterTable
ALTER TABLE "AnimalDailyCare" ADD COLUMN "cleaned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AnimalDailyCare" ADD COLUMN "cleanedById" INTEGER;
ALTER TABLE "AnimalDailyCare" ADD COLUMN "cleanedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "AnimalDailyCare" ADD CONSTRAINT "AnimalDailyCare_cleanedById_fkey" FOREIGN KEY ("cleanedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
