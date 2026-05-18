/*
  Warnings:

  - You are about to drop the column `commentsCount` on the `post` table. All the data in the column will be lost.
  - You are about to drop the column `likesCount` on the `post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "post" DROP COLUMN "commentsCount",
DROP COLUMN "likesCount";
