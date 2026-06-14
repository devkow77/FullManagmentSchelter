/*
  Warnings:

  - Added the required column `status` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MedicalRecordStatus" AS ENUM ('DO_REALIZACJI', 'W_TRAKCIE', 'ZREALIZOWANA');

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "status" "MedicalRecordStatus" NOT NULL;
