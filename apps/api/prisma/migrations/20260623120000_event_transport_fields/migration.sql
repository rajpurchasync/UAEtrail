-- Event transportation: parking, separate meeting point, car pool
ALTER TABLE "Event" ADD COLUMN "parkingPoint" TEXT;
ALTER TABLE "Event" ADD COLUMN "parkingLat" DOUBLE PRECISION;
ALTER TABLE "Event" ADD COLUMN "parkingLng" DOUBLE PRECISION;
ALTER TABLE "Event" ADD COLUMN "meetingDifferent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "carPoolEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "carPoolFree" BOOLEAN;
ALTER TABLE "Event" ADD COLUMN "carPoolPriceAed" INTEGER;
ALTER TABLE "Event" ADD COLUMN "carPoolDetails" TEXT;
