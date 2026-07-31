-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_sessions_createdAt_idx" ON "chat_sessions"("createdAt");

-- AlterTable: make documentId optional and add sessionId to chat_history
ALTER TABLE "chat_history" ALTER COLUMN "documentId" DROP NOT NULL;

ALTER TABLE "chat_history" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chat_history_sessionId_idx" ON "chat_history"("sessionId");

-- AddForeignKey
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
