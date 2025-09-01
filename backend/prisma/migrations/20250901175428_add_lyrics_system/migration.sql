/*
  Warnings:

  - You are about to drop the column `timestamp` on the `lyrics` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[songId,lineNumber]` on the table `lyrics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LyricsType" AS ENUM ('TEXT', 'PDF', 'DOC', 'DOCX');

-- AlterTable
ALTER TABLE "lyrics" DROP COLUMN "timestamp",
ADD COLUMN     "endTime" DOUBLE PRECISION,
ADD COLUMN     "lineNumber" INTEGER,
ADD COLUMN     "startTime" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "hasLyricSync" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lyricsContent" TEXT,
ADD COLUMN     "lyricsFileName" TEXT,
ADD COLUMN     "lyricsFilePath" TEXT,
ADD COLUMN     "lyricsType" "LyricsType";

-- CreateIndex
CREATE UNIQUE INDEX "lyrics_songId_lineNumber_key" ON "lyrics"("songId", "lineNumber");
