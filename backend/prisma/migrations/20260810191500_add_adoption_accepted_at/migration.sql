-- AlterTable
ALTER TABLE "Adoption" ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- Backfill: dla już zaakceptowanych wniosków użyj updatedAt jako daty akceptacji
UPDATE "Adoption"
SET "acceptedAt" = "updatedAt"
WHERE "status" = 'ZAAKCEPTOWANA' AND "acceptedAt" IS NULL;
