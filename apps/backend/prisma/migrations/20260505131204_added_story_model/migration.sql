-- CreateTable
CREATE TABLE "storyMedia" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "Mediatype" NOT NULL DEFAULT 'image',
    "duration" INTEGER NOT NULL DEFAULT 500,
    "caption" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storyMediaId" TEXT NOT NULL,

    CONSTRAINT "storyView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storyMedia_userId_idx" ON "storyMedia"("userId");

-- CreateIndex
CREATE INDEX "storyView_userId_idx" ON "storyView"("userId");

-- CreateIndex
CREATE INDEX "storyView_storyMediaId_idx" ON "storyView"("storyMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "storyView_userId_storyMediaId_key" ON "storyView"("userId", "storyMediaId");

-- AddForeignKey
ALTER TABLE "storyMedia" ADD CONSTRAINT "storyMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyView" ADD CONSTRAINT "storyView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyView" ADD CONSTRAINT "storyView_storyMediaId_fkey" FOREIGN KEY ("storyMediaId") REFERENCES "storyMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
