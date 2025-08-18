-- AlterEnum
ALTER TYPE "LocationType" ADD VALUE 'TODOS_LOS_CORISTAS';

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "color" TEXT;
