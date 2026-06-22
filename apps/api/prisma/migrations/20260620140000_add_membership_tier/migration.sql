-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('FREE', 'ACTIVE', 'PRO', 'GOAT');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "membershipTier" "MembershipTier" NOT NULL DEFAULT 'FREE';
