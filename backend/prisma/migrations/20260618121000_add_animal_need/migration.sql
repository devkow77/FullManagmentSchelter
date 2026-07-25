-- CreateEnum
CREATE TYPE "AnimalNeedCategory" AS ENUM ('JEDZENIE', 'LEKI', 'WYPOSAZENIE', 'OPIEKA', 'INNE');

-- CreateTable
CREATE TABLE "AnimalNeed" (
    "id" SERIAL NOT NULL,
    "animalId" INTEGER NOT NULL,
    "category" "AnimalNeedCategory" NOT NULL DEFAULT 'INNE',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalNeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimalNeed_animalId_idx" ON "AnimalNeed"("animalId");

-- AddForeignKey
ALTER TABLE "AnimalNeed" ADD CONSTRAINT "AnimalNeed_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
