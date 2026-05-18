-- DropForeignKey
ALTER TABLE "commentlike" DROP CONSTRAINT "commentlike_commentId_fkey";

-- AddForeignKey
ALTER TABLE "commentlike" ADD CONSTRAINT "commentlike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
