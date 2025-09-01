/*
  Warnings:

  - You are about to drop the column `lyricsContent` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `lyricsFileName` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `lyricsFilePath` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `lyricsType` on the `songs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[songId,lineNumber,voiceType]` on the table `lyrics` will be added. If there are existing duplicate values, this will fail.
  - Made the column `lineNumber` on table `lyrics` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "LyricsFileType" AS ENUM ('PDF', 'DOC', 'DOCX', 'IMAGE_JPG', 'IMAGE_PNG', 'TEXT');

-- DropIndex
DROP INDEX "lyrics_songId_lineNumber_key";

-- AlterTable
ALTER TABLE "lyrics" ADD COLUMN     "isTextLyrics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "textContent" TEXT,
ALTER COLUMN "lineNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "songs" DROP COLUMN "lyricsContent",
DROP COLUMN "lyricsFileName",
DROP COLUMN "lyricsFilePath",
DROP COLUMN "lyricsType";

-- CreateTable
CREATE TABLE "lyrics_files" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileType" "LyricsFileType" NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lyrics_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lyrics_songId_lineNumber_voiceType_key" ON "lyrics"("songId", "lineNumber", "voiceType");

-- AddForeignKey
ALTER TABLE "lyrics_files" ADD CONSTRAINT "lyrics_files_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lyrics_files" ADD CONSTRAINT "lyrics_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
