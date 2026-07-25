-- CreateTable
CREATE TABLE "AnimalDailyCare" (
    "id" SERIAL NOT NULL,
    "animalId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "fed" BOOLEAN NOT NULL DEFAULT false,
    "watered" BOOLEAN NOT NULL DEFAULT false,
    "fedById" INTEGER,
    "wateredById" INTEGER,
    "fedAt" TIMESTAMP(3),
    "wateredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalDailyCare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimalDailyCare_date_idx" ON "AnimalDailyCare"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AnimalDailyCare_animalId_date_key" ON "AnimalDailyCare"("animalId", "date");

-- AddForeignKey
ALTER TABLE "AnimalDailyCare" ADD CONSTRAINT "AnimalDailyCare_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalDailyCare" ADD CONSTRAINT "AnimalDailyCare_fedById_fkey" FOREIGN KEY ("fedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalDailyCare" ADD CONSTRAINT "AnimalDailyCare_wateredById_fkey" FOREIGN KEY ("wateredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
