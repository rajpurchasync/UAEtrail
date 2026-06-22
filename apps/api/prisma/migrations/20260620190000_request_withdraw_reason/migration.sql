-- AlterTable
ALTER TABLE "EventRequest" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "EventRequest" ADD COLUMN "cancelMessage" TEXT;
ALTER TABLE "EventRequest" ADD COLUMN "cancelledAt" TIMESTAMP(3);
