import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import type { Activity, Location } from '../domain/types.js';
import { normalizeProfileVisibility } from './media-access.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import {
  canViewProfileField,
  resolveProfileViewerAccess,
} from '../services/profile-viewer-access.js';

const PRIVATE_SAVED_PROFILE_LABEL = 'Private member';

type MongoWishlistDoc = {
  _id: string;
  userId: string;
  locationId: string | null;
  activityId: string | null;
  participantIntentId: string | null;
  productId: string | null;
  merchantId: string | null;
  tenantId: string | null;
  profileUserId: string | null;
  alertOnMatch?: boolean;
  watchOutingCategory?: string | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
  createdAt: Date;
};

type MongoLocationDoc = Omit<Location, 'id'> & { _id: string };
type MongoActivityDoc = Omit<Activity, 'id'> & { _id: string; locationId: string };
type MongoProductDoc = {
  _id: string;
  merchantId: string;
  name: string;
  images: string[];
  priceAed: number;
  discountPercent: number | null;
  category: string;
  status: string;
};
type MongoMerchantProfileDoc = {
  _id: string;
  shopName: string;
  logo?: string | null;
};
type MongoTenantDoc = {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};
type MongoAuthUserDoc = {
  _id: string;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    profileVisibility?: string | null;
  };
};

export type WishlistRecord = {
  id: string;
  userId: string;
  locationId: string | null;
  activityId: string | null;
  participantIntentId: string | null;
  productId: string | null;
  merchantId: string | null;
  tenantId: string | null;
  profileUserId: string | null;
  alertOnMatch: boolean;
  watchOutingCategory: string | null;
  watchLatitude: number | null;
  watchLongitude: number | null;
  createdAt: Date;
};

export type WishlistItemWithDetails = WishlistRecord & {
  location: { id: string; name: string; images: string[] } | null;
  activity: { id: string; title: string; locationName: string | null } | null;
  participantIntent: { id: string; title: string } | null;
  merchant: { id: string; shopName: string; logo: string | null } | null;
  tenant: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  profile: { id: string; displayName: string; avatarUrl: string | null } | null;
  product:
    | {
        id: string;
        merchantId: string;
        merchantName: string | null;
        name: string;
        images: string[];
        priceAed: number;
        discountPercent: number | null;
        category: string;
      }
    | null;
};

const wishlistCollection = (): Collection<MongoWishlistDoc> =>
  getMongoClient()!.db().collection<MongoWishlistDoc>(COLLECTIONS.USER_WISHLIST);

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

const productsCollection = (): Collection<MongoProductDoc> =>
  getMongoClient()!.db().collection<MongoProductDoc>('products');

const merchantProfilesCollection = (): Collection<MongoMerchantProfileDoc> =>
  getMongoClient()!.db().collection<MongoMerchantProfileDoc>('merchant_profiles');

const tenantsCollection = (): Collection<MongoTenantDoc> =>
  getMongoClient()!.db().collection<MongoTenantDoc>('tenants');

const authUsersCollection = (): Collection<MongoAuthUserDoc> =>
  getMongoClient()!.db().collection<MongoAuthUserDoc>('auth_users');

const mapWishlistRecord = (doc: MongoWishlistDoc): WishlistRecord => ({
  id: doc._id,
  userId: doc.userId,
  locationId: doc.locationId,
  activityId: doc.activityId,
  participantIntentId: doc.participantIntentId ?? null,
  productId: doc.productId,
  merchantId: doc.merchantId ?? null,
  tenantId: doc.tenantId ?? null,
  profileUserId: doc.profileUserId ?? null,
  alertOnMatch: doc.alertOnMatch !== false,
  watchOutingCategory: doc.watchOutingCategory ?? null,
  watchLatitude: doc.watchLatitude ?? null,
  watchLongitude: doc.watchLongitude ?? null,
  createdAt: doc.createdAt
});

const buildWishlistSelector = (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
  participantIntentId?: string;
  productId?: string;
  merchantId?: string;
  tenantId?: string;
  profileUserId?: string;
}): Record<string, string> | null => {
  if (input.locationId) return { userId: input.userId, locationId: input.locationId };
  if (input.activityId) return { userId: input.userId, activityId: input.activityId };
  if (input.participantIntentId) {
    return { userId: input.userId, participantIntentId: input.participantIntentId };
  }
  if (input.productId) return { userId: input.userId, productId: input.productId };
  if (input.merchantId) return { userId: input.userId, merchantId: input.merchantId };
  if (input.tenantId) return { userId: input.userId, tenantId: input.tenantId };
  if (input.profileUserId) return { userId: input.userId, profileUserId: input.profileUserId };
  return null;
};

export const listUserWishlistItems = async (userId: string): Promise<WishlistRecord[]> => {
  const rows = await wishlistCollection().find({ userId }).sort({ createdAt: -1 }).toArray();
  return rows.map(mapWishlistRecord);
};

export const createWishlistItem = async (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
  participantIntentId?: string;
  productId?: string;
  merchantId?: string;
  tenantId?: string;
  profileUserId?: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: string | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
}): Promise<WishlistRecord> => {
  const selector = buildWishlistSelector(input);

  if (!selector) {
    throw new Error('Exactly one wishlist target id is required.');
  }

  const existing = await wishlistCollection().findOne(selector);
  if (existing) {
    return mapWishlistRecord(existing);
  }

  const doc: MongoWishlistDoc = {
    _id: randomUUID(),
    userId: input.userId,
    locationId: input.locationId ?? null,
    activityId: input.activityId ?? null,
    participantIntentId: input.participantIntentId ?? null,
    productId: input.productId ?? null,
    merchantId: input.merchantId ?? null,
    tenantId: input.tenantId ?? null,
    profileUserId: input.profileUserId ?? null,
    alertOnMatch: input.alertOnMatch !== false,
    watchOutingCategory: input.watchOutingCategory ?? null,
    watchLatitude: input.watchLatitude ?? null,
    watchLongitude: input.watchLongitude ?? null,
    createdAt: new Date()
  };
  await wishlistCollection().insertOne(doc);
  return mapWishlistRecord(doc);
};

export const deleteWishlistItemById = async (input: { id: string; userId: string }): Promise<void> => {
  await wishlistCollection().deleteMany({ _id: input.id, userId: input.userId });
};

export const updateWishlistItem = async (input: {
  id: string;
  userId: string;
  alertOnMatch?: boolean;
}): Promise<WishlistRecord | null> => {
  const patch: Partial<MongoWishlistDoc> = {};
  if (input.alertOnMatch !== undefined) patch.alertOnMatch = input.alertOnMatch;
  if (Object.keys(patch).length === 0) {
    const existing = await wishlistCollection().findOne({ _id: input.id, userId: input.userId });
    return existing ? mapWishlistRecord(existing) : null;
  }
  const result = await wishlistCollection().findOneAndUpdate(
    { _id: input.id, userId: input.userId },
    { $set: patch },
    { returnDocument: 'after' }
  );
  return result ? mapWishlistRecord(result) : null;
};

export const findWishlistItem = async (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
  participantIntentId?: string;
  productId?: string;
  merchantId?: string;
  tenantId?: string;
  profileUserId?: string;
}): Promise<WishlistRecord | null> => {
  if (
    !input.locationId &&
    !input.activityId &&
    !input.participantIntentId &&
    !input.productId &&
    !input.merchantId &&
    !input.tenantId &&
    !input.profileUserId
  ) {
    return null;
  }

  const selector = buildWishlistSelector(input);
  if (!selector) return null;

  const row = await wishlistCollection().findOne(selector);
  return row ? mapWishlistRecord(row) : null;
};

export const listWishlistItemsWithDetails = async (userId: string): Promise<WishlistItemWithDetails[]> => {
  const wishlistRows = await listUserWishlistItems(userId);
  if (wishlistRows.length === 0) {
    return [];
  }

  const locationIds = [...new Set(wishlistRows.map((f) => f.locationId).filter((id): id is string => Boolean(id)))];
  const activityIds = [...new Set(wishlistRows.map((f) => f.activityId).filter((id): id is string => Boolean(id)))];
  const participantIntentIds = [
    ...new Set(wishlistRows.map((f) => f.participantIntentId).filter((id): id is string => Boolean(id))),
  ];
  const productIds = [...new Set(wishlistRows.map((f) => f.productId).filter((id): id is string => Boolean(id)))];
  const merchantIds = [...new Set(wishlistRows.map((f) => f.merchantId).filter((id): id is string => Boolean(id)))];
  const tenantIds = [...new Set(wishlistRows.map((f) => f.tenantId).filter((id): id is string => Boolean(id)))];
  const profileUserIds = [...new Set(wishlistRows.map((f) => f.profileUserId).filter((id): id is string => Boolean(id)))];

  const [locationDocs, activityDocs, intentDocs, productDocs, merchantDocs, tenantDocs, profileDocs] =
    await Promise.all([
    locationIds.length > 0
      ? locationsCollection().find({ _id: { $in: locationIds } }, { projection: { name: 1, images: 1 } }).toArray()
      : Promise.resolve([]),
    activityIds.length > 0
      ? activitiesCollection().find({ _id: { $in: activityIds } }, { projection: { title: 1, locationId: 1 } }).toArray()
      : Promise.resolve([]),
    participantIntentIds.length > 0
      ? activitiesCollection()
          .find(
            {
              participantIntentId: { $in: participantIntentIds },
              activityMode: 'seeking',
            },
            { projection: { participantIntentId: 1, title: 1 } }
          )
          .toArray()
      : Promise.resolve([]),
    productIds.length > 0
      ? productsCollection()
          .find({ _id: { $in: productIds }, status: 'ACTIVE' }, { projection: { name: 1, images: 1, priceAed: 1, discountPercent: 1, category: 1, merchantId: 1 } })
          .toArray()
      : Promise.resolve([]),
    merchantIds.length > 0
      ? merchantProfilesCollection()
          .find({ _id: { $in: merchantIds } }, { projection: { shopName: 1, logo: 1 } })
          .toArray()
      : Promise.resolve([]),
    tenantIds.length > 0
      ? tenantsCollection()
          .find({ _id: { $in: tenantIds } }, { projection: { name: 1, slug: 1, logoUrl: 1 } })
          .toArray()
      : Promise.resolve([]),
    profileUserIds.length > 0
      ? authUsersCollection()
          .find({ _id: { $in: profileUserIds } }, { projection: { profile: 1 } })
          .toArray()
      : Promise.resolve([])
  ]);

  const locationMap = new Map(locationDocs.map((location) => [location._id, location]));
  const activityLocationIds = [...new Set(activityDocs.map((activity) => activity.locationId))];
  const activityLocationDocs =
    activityLocationIds.length > 0
      ? await locationsCollection().find({ _id: { $in: activityLocationIds } }, { projection: { name: 1 } }).toArray()
      : [];
  const activityLocationMap = new Map(activityLocationDocs.map((location) => [location._id, location.name]));
  const activityMap = new Map(activityDocs.map((activity) => [activity._id, activity]));
  const intentMap = new Map(
    intentDocs
      .filter((activity) => activity.participantIntentId)
      .map((activity) => [
        activity.participantIntentId!,
        { _id: activity.participantIntentId!, title: activity.title },
      ])
  );
  const productMap = new Map(productDocs.map((product) => [product._id, product]));
  const savedMerchantMap = new Map(merchantDocs.map((merchant) => [merchant._id, merchant]));
  const tenantMap = new Map(tenantDocs.map((tenant) => [tenant._id, tenant]));
  const profileMap = new Map(profileDocs.map((profile) => [profile._id, profile]));
  const productMerchantIds = [...new Set(productDocs.map((product) => product.merchantId))];
  const productMerchantDocs =
    productMerchantIds.length > 0
      ? await merchantProfilesCollection().find({ _id: { $in: productMerchantIds } }, { projection: { shopName: 1 } }).toArray()
      : [];
  const productMerchantMap = new Map(productMerchantDocs.map((merchant) => [merchant._id, merchant.shopName]));

  const profileUserIdsNeedingAccess = profileUserIds.filter((profileUserId) => {
    if (profileUserId === userId) return false;
    const row = profileMap.get(profileUserId);
    if (!row) return false;
    return normalizeProfileVisibility(row.profile?.profileVisibility) !== 'public';
  });
  const accessEntries = await Promise.all(
    profileUserIdsNeedingAccess.map(async (profileUserId) => {
      const row = profileMap.get(profileUserId)!;
      const visibility = normalizeProfileVisibility(row.profile?.profileVisibility);
      const access = await resolveProfileViewerAccess({
        viewerUserId: userId,
        targetUserId: profileUserId,
        targetVisibility: visibility,
      });
      return [profileUserId, access] as const;
    })
  );
  const profileAccessMap = new Map(accessEntries);

  const resolveSavedProfile = (profileUserId: string): WishlistItemWithDetails['profile'] => {
    const row = profileMap.get(profileUserId);
    if (!row) return null;

    const visibility = normalizeProfileVisibility(row.profile?.profileVisibility);
    if (profileUserId === userId || visibility === 'public') {
      const displayName = row.profile?.displayName?.trim() || PRIVATE_SAVED_PROFILE_LABEL;
      return {
        id: profileUserId,
        displayName,
        avatarUrl: row.profile?.avatarUrl ?? null,
      };
    }

    const access = profileAccessMap.get(profileUserId);
    if (!access || !canViewProfileField(visibility, access, 'identity')) {
      return {
        id: profileUserId,
        displayName: PRIVATE_SAVED_PROFILE_LABEL,
        avatarUrl: null,
      };
    }

    const displayName = row.profile?.displayName?.trim() || PRIVATE_SAVED_PROFILE_LABEL;
    return {
      id: profileUserId,
      displayName,
      avatarUrl: row.profile?.avatarUrl ?? null,
    };
  };

  return wishlistRows.map((item) => ({
    ...item,
    location: item.locationId
      ? (() => {
          const location = locationMap.get(item.locationId);
          return location
            ? { id: location._id, name: location.name, images: location.images }
            : null;
        })()
      : null,
    activity: item.activityId
      ? (() => {
          const activity = activityMap.get(item.activityId);
          return activity
            ? {
                id: activity._id,
                title: activity.title,
                locationName: activityLocationMap.get(activity.locationId) ?? null
              }
            : null;
        })()
      : null,
    participantIntent: item.participantIntentId
      ? (() => {
          const intent = intentMap.get(item.participantIntentId!);
          return intent ? { id: intent._id, title: intent.title } : null;
        })()
      : null,
    merchant: item.merchantId
      ? (() => {
          const merchant = savedMerchantMap.get(item.merchantId);
          return merchant
            ? { id: merchant._id, shopName: merchant.shopName, logo: merchant.logo ?? null }
            : null;
        })()
      : null,
    tenant: item.tenantId
      ? (() => {
          const tenant = tenantMap.get(item.tenantId);
          return tenant
            ? {
                id: tenant._id,
                name: tenant.name,
                slug: tenant.slug,
                logoUrl: tenant.logoUrl ?? null
              }
            : null;
        })()
      : null,
    profile: item.profileUserId ? resolveSavedProfile(item.profileUserId) : null,
    product: item.productId
      ? (() => {
          const product = productMap.get(item.productId);
          return product
            ? {
                id: product._id,
                merchantId: product.merchantId,
                merchantName: productMerchantMap.get(product.merchantId) ?? null,
                name: product.name,
                images: product.images,
                priceAed: product.priceAed,
                discountPercent: product.discountPercent,
                category: product.category
              }
            : null;
        })()
      : null,
  }));
};

export const deleteWishlistItemsForUser = async (userId: string): Promise<void> => {
  await wishlistCollection().deleteMany({ userId });
};

/** wishlistRows that opted into geographic/category wishlist alerts. */
export const listWishlistWatchCandidates = async () => {
  const rows = await wishlistCollection()
    .find({
      alertOnMatch: { $ne: false },
      watchOutingCategory: { $exists: true, $ne: null },
      $or: [{ participantIntentId: null }, { participantIntentId: { $exists: false } }],
    })
    .toArray();

  return rows.map((doc) => ({
    userId: doc.userId,
    wishlistItemId: doc._id,
    alertOnMatch: doc.alertOnMatch !== false,
    watchOutingCategory: doc.watchOutingCategory as import('@uaetrail/shared-types').OutingCategory | null,
    watchLatitude: doc.watchLatitude ?? null,
    watchLongitude: doc.watchLongitude ?? null,
  }));
};
