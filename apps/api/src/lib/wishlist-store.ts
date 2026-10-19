import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import type { Activity, Location } from '../domain/types.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

type MongoWishlistDoc = {
  _id: string;
  userId: string;
  locationId: string | null;
  activityId: string | null;
  alertOnMatch?: boolean;
  watchOutingCategory?: string | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
  createdAt: Date;
};

type MongoLocationDoc = Omit<Location, 'id'> & { _id: string };
type MongoActivityDoc = Omit<Activity, 'id'> & { _id: string; locationId: string };

export type WishlistRecord = {
  id: string;
  userId: string;
  locationId: string | null;
  activityId: string | null;
  alertOnMatch: boolean;
  watchOutingCategory: string | null;
  watchLatitude: number | null;
  watchLongitude: number | null;
  createdAt: Date;
};

export type WishlistItemWithDetails = WishlistRecord & {
  location: { id: string; name: string; images: string[] } | null;
  activity: { id: string; title: string; locationName: string | null } | null;
};

const wishlistCollection = (): Collection<MongoWishlistDoc> =>
  getMongoClient()!.db().collection<MongoWishlistDoc>(COLLECTIONS.USER_WISHLIST);

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

const mapWishlistRecord = (doc: MongoWishlistDoc): WishlistRecord => ({
  id: doc._id,
  userId: doc.userId,
  locationId: doc.locationId,
  activityId: doc.activityId,
  alertOnMatch: doc.alertOnMatch !== false,
  watchOutingCategory: doc.watchOutingCategory ?? null,
  watchLatitude: doc.watchLatitude ?? null,
  watchLongitude: doc.watchLongitude ?? null,
  createdAt: doc.createdAt,
});

const buildWishlistSelector = (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
}): Record<string, string> | null => {
  if (input.locationId) return { userId: input.userId, locationId: input.locationId };
  if (input.activityId) return { userId: input.userId, activityId: input.activityId };
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
  alertOnMatch?: boolean;
  watchOutingCategory?: string | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
}): Promise<WishlistRecord> => {
  const selector = buildWishlistSelector(input);

  if (!selector) {
    throw new Error('Wishlist saves a single venue (locationId) or activity (activityId).');
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
    alertOnMatch: input.alertOnMatch !== false,
    watchOutingCategory: input.watchOutingCategory ?? null,
    watchLatitude: input.watchLatitude ?? null,
    watchLongitude: input.watchLongitude ?? null,
    createdAt: new Date(),
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
}): Promise<WishlistRecord | null> => {
  if (!input.locationId && !input.activityId) {
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

  const [locationDocs, activityDocs] = await Promise.all([
    locationIds.length > 0
      ? locationsCollection().find({ _id: { $in: locationIds } }, { projection: { name: 1, images: 1 } }).toArray()
      : Promise.resolve([]),
    activityIds.length > 0
      ? activitiesCollection().find({ _id: { $in: activityIds } }, { projection: { title: 1, locationId: 1 } }).toArray()
      : Promise.resolve([]),
  ]);

  const locationMap = new Map(locationDocs.map((location) => [location._id, location]));
  const activityLocationIds = [...new Set(activityDocs.map((activity) => activity.locationId))];
  const activityLocationDocs =
    activityLocationIds.length > 0
      ? await locationsCollection().find({ _id: { $in: activityLocationIds } }, { projection: { name: 1 } }).toArray()
      : [];
  const activityLocationMap = new Map(activityLocationDocs.map((location) => [location._id, location.name]));
  const activityMap = new Map(activityDocs.map((activity) => [activity._id, activity]));

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
                locationName: activityLocationMap.get(activity.locationId) ?? null,
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
