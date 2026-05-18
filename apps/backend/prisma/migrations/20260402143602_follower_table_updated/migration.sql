/*
  Warnings:

  - You are about to drop the column `followerId` on the `follow` table. All the data in the column will be lost.
  - You are about to drop the column `followingId` on the `follow` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userIdWhoFollows,userBeingFollowed]` on the table `follow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userBeingFollowed` to the `follow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userIdWhoFollows` to the `follow` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "follow" DROP CONSTRAINT "follow_followerId_fkey";

-- DropForeignKey
ALTER TABLE "follow" DROP CONSTRAINT "follow_followingId_fkey";

-- DropIndex
DROP INDEX "follow_followerId_followingId_key";

-- DropIndex
DROP INDEX "follow_followerId_idx";

-- DropIndex
DROP INDEX "follow_followingId_idx";

-- AlterTable
ALTER TABLE "follow" DROP COLUMN "followerId",
DROP COLUMN "followingId",
ADD COLUMN     "userBeingFollowed" TEXT NOT NULL,
ADD COLUMN     "userIdWhoFollows" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "follow_userIdWhoFollows_idx" ON "follow"("userIdWhoFollows");

-- CreateIndex
CREATE INDEX "follow_userBeingFollowed_idx" ON "follow"("userBeingFollowed");

-- CreateIndex
CREATE UNIQUE INDEX "follow_userIdWhoFollows_userBeingFollowed_key" ON "follow"("userIdWhoFollows", "userBeingFollowed");

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_userIdWhoFollows_fkey" FOREIGN KEY ("userIdWhoFollows") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_userBeingFollowed_fkey" FOREIGN KEY ("userBeingFollowed") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
