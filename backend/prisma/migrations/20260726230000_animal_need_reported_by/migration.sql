-- AlterTable
ALTER TABLE "AnimalNeed" ADD COLUMN "reportedById" INTEGER;

-- CreateIndex
CREATE INDEX "AnimalNeed_reportedById_idx" ON "AnimalNeed"("reportedById");

-- CreateIndex
CREATE INDEX "AnimalNeed_isActive_idx" ON "AnimalNeed"("isActive");

-- AddForeignKey
ALTER TABLE "AnimalNeed" ADD CONSTRAINT "AnimalNeed_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
