-- AlterEnum
ALTER TYPE "EventAttendeeStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "event_attendees" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "user_voice_profiles" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;
