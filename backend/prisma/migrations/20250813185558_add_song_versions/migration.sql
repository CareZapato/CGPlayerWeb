-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "genre" TEXT,
ADD COLUMN     "parentSongId" TEXT,
ADD COLUMN     "voiceType" "VoiceType";

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_parentSongId_fkey" FOREIGN KEY ("parentSongId") REFERENCES "songs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
