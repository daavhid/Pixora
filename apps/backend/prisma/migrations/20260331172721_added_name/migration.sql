-- CreateTable
CREATE TABLE "commentlike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commentlike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commentlike_commentId_idx" ON "commentlike"("commentId");

-- CreateIndex
CREATE INDEX "commentlike_userId_idx" ON "commentlike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "commentlike_commentId_userId_key" ON "commentlike"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "commentlike" ADD CONSTRAINT "commentlike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentlike" ADD CONSTRAINT "commentlike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
