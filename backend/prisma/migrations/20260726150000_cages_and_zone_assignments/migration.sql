-- CreateTable
CREATE TABLE "Cage" (
    "id" SERIAL NOT NULL,
    "zone" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyZoneAssignment" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "zone" TEXT NOT NULL,
    "workerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyZoneAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cage_zone_idx" ON "Cage"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "Cage_zone_number_key" ON "Cage"("zone", "number");

-- CreateIndex
CREATE INDEX "DailyZoneAssignment_date_idx" ON "DailyZoneAssignment"("date");

-- CreateIndex
CREATE INDEX "DailyZoneAssignment_workerId_idx" ON "DailyZoneAssignment"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyZoneAssignment_date_zone_key" ON "DailyZoneAssignment"("date", "zone");

-- AddForeignKey
ALTER TABLE "DailyZoneAssignment" ADD CONSTRAINT "DailyZoneAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: prepare Animal.cageId from existing cageNumber values
ALTER TABLE "Animal" ADD COLUMN "cageId" INTEGER;

-- Seed cages from distinct Animal.cageNumber values (format: A-12)
INSERT INTO "Cage" ("zone", "number", "updatedAt")
SELECT DISTINCT
  UPPER(SPLIT_PART("cageNumber", '-', 1)) AS zone,
  CAST(SPLIT_PART("cageNumber", '-', 2) AS INTEGER) AS number,
  CURRENT_TIMESTAMP
FROM "Animal"
WHERE "cageNumber" IS NOT NULL
  AND "cageNumber" ~ '^[A-Za-z]-\d+$'
ON CONFLICT ("zone", "number") DO NOTHING;

-- Also ensure empty cages exist for zones A-D (1..20) so forms have free slots
INSERT INTO "Cage" ("zone", "number", "updatedAt")
SELECT z.zone, n.number, CURRENT_TIMESTAMP
FROM (VALUES ('A'), ('B'), ('C'), ('D')) AS z(zone)
CROSS JOIN generate_series(1, 20) AS n(number)
ON CONFLICT ("zone", "number") DO NOTHING;

-- Link animals to cages
UPDATE "Animal" AS a
SET "cageId" = c.id
FROM "Cage" AS c
WHERE a."cageNumber" IS NOT NULL
  AND a."cageNumber" ~ '^[A-Za-z]-\d+$'
  AND c.zone = UPPER(SPLIT_PART(a."cageNumber", '-', 1))
  AND c.number = CAST(SPLIT_PART(a."cageNumber", '-', 2) AS INTEGER);

-- Drop old cageNumber column and unique index
DROP INDEX IF EXISTS "Animal_cageNumber_key";
ALTER TABLE "Animal" DROP COLUMN "cageNumber";

-- CreateIndex
CREATE UNIQUE INDEX "Animal_cageId_key" ON "Animal"("cageId");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_cageId_fkey" FOREIGN KEY ("cageId") REFERENCES "Cage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
