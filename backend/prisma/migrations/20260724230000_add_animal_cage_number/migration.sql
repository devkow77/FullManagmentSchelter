-- AlterTable
ALTER TABLE "Animal" ADD COLUMN "cageNumber" TEXT;

-- Backfill existing rows before NOT NULL / UNIQUE
UPDATE "Animal" SET "cageNumber" = lpad("id"::text, 3, '0') WHERE "cageNumber" IS NULL;

-- AlterTable
ALTER TABLE "Animal" ALTER COLUMN "cageNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Animal_cageNumber_key" ON "Animal"("cageNumber");
