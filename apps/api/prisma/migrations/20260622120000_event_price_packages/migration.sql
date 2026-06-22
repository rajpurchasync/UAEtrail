-- Trip pricing packages (organizer-defined options) and join-time package selection
ALTER TABLE "Event" ADD COLUMN "pricePackages" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "EventRequest" ADD COLUMN "selectedPackageIndex" INTEGER;
