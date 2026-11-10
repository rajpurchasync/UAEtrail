import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import { LocationUnlockSource, MembershipTier, UserRole } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findLocationInMongo } from '../lib/entity-sync.js';
import { getMongoClient } from '../lib/mongo.js';
import { getAuthUserMembershipTier } from '../lib/auth-users-store.js';
export { readStoredFile } from '../lib/stored-file-read.js';

type MongoLocationUnlock = {
  _id: string;
  userId: string;
  locationId: string;
  source: LocationUnlockSource;
  createdAt: Date;
};

const locationUnlocksCollection = (): Collection<MongoLocationUnlock> =>
  getMongoClient()!.db().collection<MongoLocationUnlock>('location_unlocks');

export type PremiumAccessReason = 'pro' | 'goat' | 'admin' | 'unlocked' | 'locked';

export interface PremiumAccessResult {
  hasAccess: boolean;
  reason: PremiumAccessReason;
  membershipTier: MembershipTier;
}

export const locationHasPremiumContent = (location: Pick<Location, 'gpxKey' | 'guideMarkdown' | 'guidePdfKey'>) =>
  Boolean(location.gpxKey || location.guideMarkdown || location.guidePdfKey);

async function getUserMembershipTier(userId: string): Promise<MembershipTier> {
  return getAuthUserMembershipTier(userId);
}

export async function checkPremiumAccess(
  userId: string | null,
  locationId: string,
  role?: UserRole
): Promise<PremiumAccessResult> {
  if (!userId) {
    return { hasAccess: false, reason: 'locked', membershipTier: MembershipTier.FREE };
  }

  if (role === UserRole.PLATFORM_ADMIN) {
    const tier = await getUserMembershipTier(userId);
    return { hasAccess: true, reason: 'admin', membershipTier: tier };
  }

  const tier = await getUserMembershipTier(userId);
  if (tier === MembershipTier.PRO) {
    return { hasAccess: true, reason: 'pro', membershipTier: tier };
  }
  if (tier === MembershipTier.GOAT) {
    return { hasAccess: true, reason: 'goat', membershipTier: tier };
  }

  const unlock = await locationUnlocksCollection().findOne({ userId, locationId });
  if (unlock) {
    return { hasAccess: true, reason: 'unlocked', membershipTier: tier };
  }

  return { hasAccess: false, reason: 'locked', membershipTier: tier };
}

export async function assertPremiumAccess(userId: string, locationId: string, role?: UserRole): Promise<PremiumAccessResult> {
  const access = await checkPremiumAccess(userId, locationId, role);
  if (!access.hasAccess) {
    throw new ApiError(403, 'premium_required', 'Unlock this location or upgrade to Pro/GOAT for full access.');
  }
  return access;
}

export async function unlockLocationForUser(
  userId: string,
  locationId: string,
  source: LocationUnlockSource = LocationUnlockSource.PURCHASE
) {
  const location = await findLocationInMongo(locationId);
  if (!location) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }
  if (!locationHasPremiumContent(location)) {
    throw new ApiError(400, 'no_premium_content', 'This location has no premium map or guide content.');
  }

  const existing = await checkPremiumAccess(userId, locationId);
  if (existing.hasAccess) {
    return existing;
  }

  await locationUnlocksCollection().updateOne(
    { userId, locationId },
    {
      $setOnInsert: {
        _id: randomUUID(),
        userId,
        locationId,
        source,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  return checkPremiumAccess(userId, locationId);
}

export async function deleteLocationUnlocksByUser(userId: string): Promise<void> {
  await locationUnlocksCollection().deleteMany({ userId });
}

export function buildPremiumSummary(
  location: Pick<Location, 'gpxKey' | 'guideMarkdown' | 'guidePdfKey' | 'guidePreview' | 'unlockPriceAed'>,
  access: PremiumAccessResult
) {
  const hasRouteMap = Boolean(location.gpxKey);
  const hasGuide = Boolean(location.guideMarkdown || location.guidePdfKey);
  const hasPremium = hasRouteMap || hasGuide;

  return {
    hasPremium,
    hasRouteMap,
    hasGuide,
    hasGuidePdf: Boolean(location.guidePdfKey),
    unlockPriceAed: location.unlockPriceAed,
    guidePreview: location.guidePreview ?? null,
    isUnlocked: access.hasAccess,
    accessReason: access.reason,
    membershipTier: access.membershipTier.toLowerCase()
  };
}
