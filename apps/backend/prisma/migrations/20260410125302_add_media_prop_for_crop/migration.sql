/*
  Warnings:

  - Made the column `aspect` on table `postMedia` required. This step will fail if there are existing NULL values in that column.
  - Made the column `x` on table `postMedia` required. This step will fail if there are existing NULL values in that column.
  - Made the column `y` on table `postMedia` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "postMedia" ALTER COLUMN "aspect" SET NOT NULL,
ALTER COLUMN "aspect" SET DEFAULT 0.8,
ALTER COLUMN "x" SET NOT NULL,
ALTER COLUMN "x" SET DEFAULT 0,
ALTER COLUMN "y" SET NOT NULL,
ALTER COLUMN "y" SET DEFAULT 0;
