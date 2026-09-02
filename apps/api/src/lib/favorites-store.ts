import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import type { Activity, Location } from '../domain/types.js';
import { getMongoClient } from './mongo.js';

type MongoFavorite = {
  _id: string;
  userId: string;
  locationId: string | null;
  activityId: string | null;
  productId: string | null;
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
};

export type FavoriteRecord = {
  id: string;
  userId: string;
  locationId: string | null;
  activityId: string | null;
  productId: string | null;
  createdAt: Date;
};

export type FavoriteWithDetails = FavoriteRecord & {
  location: { id: string; name: string; images: string[] } | null;
  activity: { id: string; title: string; locationName: string | null } | null;
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

const favoritesCollection = (): Collection<MongoFavorite> =>
  getMongoClient()!.db().collection<MongoFavorite>('user_favorites');

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

const productsCollection = (): Collection<MongoProductDoc> =>
  getMongoClient()!.db().collection<MongoProductDoc>('products');

const merchantProfilesCollection = (): Collection<MongoMerchantProfileDoc> =>
  getMongoClient()!.db().collection<MongoMerchantProfileDoc>('merchant_profiles');

const mapFavorite = (doc: MongoFavorite): FavoriteRecord => ({
  id: doc._id,
  userId: doc.userId,
  locationId: doc.locationId,
  activityId: doc.activityId,
  productId: doc.productId,
  createdAt: doc.createdAt
});

export const listUserFavorites = async (userId: string): Promise<FavoriteRecord[]> => {
  const rows = await favoritesCollection().find({ userId }).sort({ createdAt: -1 }).toArray();
  return rows.map(mapFavorite);
};

export const createUserFavorite = async (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
  productId?: string;
}): Promise<FavoriteRecord> => {
  const selector = input.locationId
    ? { userId: input.userId, locationId: input.locationId }
    : input.activityId
      ? { userId: input.userId, activityId: input.activityId }
      : input.productId
        ? { userId: input.userId, productId: input.productId }
        : null;

  if (!selector) {
    throw new Error('locationId, activityId, or productId is required.');
  }

  const existing = await favoritesCollection().findOne(selector);
  if (existing) {
    return mapFavorite(existing);
  }

  const doc: MongoFavorite = {
    _id: randomUUID(),
    userId: input.userId,
    locationId: input.locationId ?? null,
    activityId: input.activityId ?? null,
    productId: input.productId ?? null,
    createdAt: new Date()
  };
  await favoritesCollection().insertOne(doc);
  return mapFavorite(doc);
};

export const deleteUserFavoriteById = async (input: { id: string; userId: string }): Promise<void> => {
  await favoritesCollection().deleteMany({ _id: input.id, userId: input.userId });
};

export const findUserFavorite = async (input: {
  userId: string;
  locationId?: string;
  activityId?: string;
  productId?: string;
}): Promise<FavoriteRecord | null> => {
  if (!input.locationId && !input.activityId && !input.productId) {
    return null;
  }

  const row = await favoritesCollection().findOne({
    userId: input.userId,
    ...(input.locationId ? { locationId: input.locationId } : {}),
    ...(input.activityId ? { activityId: input.activityId } : {}),
    ...(input.productId ? { productId: input.productId } : {})
  });
  return row ? mapFavorite(row) : null;
};

export const listUserFavoritesWithDetails = async (userId: string): Promise<FavoriteWithDetails[]> => {
  const favorites = await listUserFavorites(userId);
  if (favorites.length === 0) {
    return [];
  }

  const locationIds = [...new Set(favorites.map((f) => f.locationId).filter((id): id is string => Boolean(id)))];
  const activityIds = [...new Set(favorites.map((f) => f.activityId).filter((id): id is string => Boolean(id)))];
  const productIds = [...new Set(favorites.map((f) => f.productId).filter((id): id is string => Boolean(id)))];

  const [locationDocs, activityDocs, productDocs] = await Promise.all([
    locationIds.length > 0
      ? locationsCollection().find({ _id: { $in: locationIds } }, { projection: { name: 1, images: 1 } }).toArray()
      : Promise.resolve([]),
    activityIds.length > 0
      ? activitiesCollection().find({ _id: { $in: activityIds } }, { projection: { title: 1, locationId: 1 } }).toArray()
      : Promise.resolve([]),
    productIds.length > 0
      ? productsCollection()
          .find({ _id: { $in: productIds }, status: 'ACTIVE' }, { projection: { name: 1, images: 1, priceAed: 1, discountPercent: 1, category: 1, merchantId: 1 } })
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
  const productMap = new Map(productDocs.map((product) => [product._id, product]));
  const merchantIds = [...new Set(productDocs.map((product) => product.merchantId))];
  const merchantDocs =
    merchantIds.length > 0
      ? await merchantProfilesCollection().find({ _id: { $in: merchantIds } }, { projection: { shopName: 1 } }).toArray()
      : [];
  const merchantMap = new Map(merchantDocs.map((merchant) => [merchant._id, merchant.shopName]));

  return favorites.map((favorite) => ({
    ...favorite,
    location: favorite.locationId
      ? (() => {
          const location = locationMap.get(favorite.locationId);
          return location
            ? { id: location._id, name: location.name, images: location.images }
            : null;
        })()
      : null,
    activity: favorite.activityId
      ? (() => {
          const activity = activityMap.get(favorite.activityId);
          return activity
            ? {
                id: activity._id,
                title: activity.title,
                locationName: activityLocationMap.get(activity.locationId) ?? null
              }
            : null;
        })()
      : null,
    product: favorite.productId
      ? (() => {
          const product = productMap.get(favorite.productId);
          return product
            ? {
                id: product._id,
                merchantId: product.merchantId,
                merchantName: merchantMap.get(product.merchantId) ?? null,
                name: product.name,
                images: product.images,
                priceAed: product.priceAed,
                discountPercent: product.discountPercent,
                category: product.category
              }
            : null;
        })()
      : null
  }));
};

export const deleteUserFavoritesByUser = async (userId: string): Promise<void> => {
  await favoritesCollection().deleteMany({ userId });
};
