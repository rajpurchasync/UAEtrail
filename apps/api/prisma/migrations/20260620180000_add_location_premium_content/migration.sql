-- Location premium content: route maps, guides, per-location unlocks
CREATE TYPE "LocationUnlockSource" AS ENUM ('PURCHASE', 'SUBSCRIPTION', 'ADMIN_GRANT');

ALTER TABLE "Location" ADD COLUMN "gpxKey" TEXT;
ALTER TABLE "Location" ADD COLUMN "guidePdfKey" TEXT;
ALTER TABLE "Location" ADD COLUMN "guideMarkdown" TEXT;
ALTER TABLE "Location" ADD COLUMN "guidePreview" TEXT;
ALTER TABLE "Location" ADD COLUMN "unlockPriceAed" INTEGER NOT NULL DEFAULT 29;

CREATE TABLE "LocationUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "source" "LocationUnlockSource" NOT NULL DEFAULT 'PURCHASE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocationUnlock_userId_locationId_key" ON "LocationUnlock"("userId", "locationId");
CREATE INDEX "LocationUnlock_locationId_idx" ON "LocationUnlock"("locationId");

ALTER TABLE "LocationUnlock" ADD CONSTRAINT "LocationUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocationUnlock" ADD CONSTRAINT "LocationUnlock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
