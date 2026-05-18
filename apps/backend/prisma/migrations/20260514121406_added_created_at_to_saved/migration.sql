-- AlterTable
ALTER TABLE "savedPost" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "savedPost_createdAt_idx" ON "savedPost"("createdAt");
