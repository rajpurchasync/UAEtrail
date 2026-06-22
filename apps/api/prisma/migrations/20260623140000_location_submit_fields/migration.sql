-- Location submission: emirate, parking pin, premium gallery
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "emirate" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "parkingLat" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "parkingLng" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "premiumImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
