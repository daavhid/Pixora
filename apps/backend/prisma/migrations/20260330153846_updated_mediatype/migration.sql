/*
  Warnings:

  - The values [IMAGE,VIDEO] on the enum `Mediatype` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `url` to the `postMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Mediatype_new" AS ENUM ('image', 'video', 'raw');
ALTER TABLE "postMedia" ALTER COLUMN "type" TYPE "Mediatype_new" USING ("type"::text::"Mediatype_new");
ALTER TYPE "Mediatype" RENAME TO "Mediatype_old";
ALTER TYPE "Mediatype_new" RENAME TO "Mediatype";
DROP TYPE "public"."Mediatype_old";
COMMIT;

-- AlterTable
ALTER TABLE "postMedia" ADD COLUMN     "url" TEXT NOT NULL;
