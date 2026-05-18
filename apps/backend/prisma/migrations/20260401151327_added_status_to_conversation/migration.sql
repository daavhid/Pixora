-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('accepted', 'pending', 'rejected');

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "conversationParticipant" ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'pending';
