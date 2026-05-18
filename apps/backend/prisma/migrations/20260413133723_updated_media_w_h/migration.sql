/*
  Warnings:

  - Made the column `cropHeight` on table `postMedia` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cropWidth` on table `postMedia` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "postMedia" ALTER COLUMN "cropHeight" SET NOT NULL,
ALTER COLUMN "cropHeight" SET DEFAULT 1024,
ALTER COLUMN "cropWidth" SET NOT NULL,
ALTER COLUMN "cropWidth" SET DEFAULT 1024;
