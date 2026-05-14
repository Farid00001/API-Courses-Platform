-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CourseVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'RESTRICTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3);

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "visibility" "CourseVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" SERIAL NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER NOT NULL,

  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
