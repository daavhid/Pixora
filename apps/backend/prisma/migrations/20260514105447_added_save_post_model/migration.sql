-- CreateTable
CREATE TABLE "savedPost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "savedPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "savedPost_postId_idx" ON "savedPost"("postId");

-- CreateIndex
CREATE INDEX "savedPost_userId_idx" ON "savedPost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "savedPost_postId_userId_key" ON "savedPost"("postId", "userId");

-- AddForeignKey
ALTER TABLE "savedPost" ADD CONSTRAINT "savedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savedPost" ADD CONSTRAINT "savedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
