/*
  Warnings:

  - Made the column `phone` on table `Vet` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clinic` on table `Vet` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Vet" ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "clinic" SET NOT NULL;
