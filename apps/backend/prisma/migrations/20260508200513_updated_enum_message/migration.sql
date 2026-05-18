/*
  Warnings:

  - Changed the type of `type` on the `messageAttachment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MessageMediatype" AS ENUM ('image', 'video', 'raw');

-- AlterTable
ALTER TABLE "messageAttachment" DROP COLUMN "type",
ADD COLUMN     "type" "MessageMediatype" NOT NULL;
