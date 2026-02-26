-- AlterEnum
ALTER TYPE "LocationStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "campingType" TEXT,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "elevation" INTEGER,
ADD COLUMN     "highlights" TEXT[],
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
