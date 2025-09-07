-- CreateEnum
CREATE TYPE "NewsType" AS ENUM ('SONG_ADDED', 'EVENT_CREATED', 'EVENT_UPDATED', 'VERSION_RELEASED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Culto';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profileImage" TEXT;

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "NewsType" NOT NULL,
    "icon" TEXT NOT NULL,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);
