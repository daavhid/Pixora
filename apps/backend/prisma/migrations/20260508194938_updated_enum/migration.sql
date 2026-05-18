/*
  Warnings:

  - The values [raw] on the enum `Mediatype` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Mediatype_new" AS ENUM ('image', 'video');
ALTER TABLE "public"."storyMedia" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "postMedia" ALTER COLUMN "type" TYPE "Mediatype_new" USING ("type"::text::"Mediatype_new");
ALTER TABLE "messageAttachment" ALTER COLUMN "type" TYPE "Mediatype_new" USING ("type"::text::"Mediatype_new");
ALTER TABLE "storyMedia" ALTER COLUMN "type" TYPE "Mediatype_new" USING ("type"::text::"Mediatype_new");
ALTER TYPE "Mediatype" RENAME TO "Mediatype_old";
ALTER TYPE "Mediatype_new" RENAME TO "Mediatype";
DROP TYPE "public"."Mediatype_old";
ALTER TABLE "storyMedia" ALTER COLUMN "type" SET DEFAULT 'image';
COMMIT;
