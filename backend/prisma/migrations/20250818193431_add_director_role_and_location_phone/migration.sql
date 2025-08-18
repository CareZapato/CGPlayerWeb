-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DIRECTOR';

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "phone" TEXT;
