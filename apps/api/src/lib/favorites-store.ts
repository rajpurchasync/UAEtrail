import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import type { Event, Location } from '../domain/types.js';
import { getMongoClient } from './mongo.js';

type MongoFavorite = {
  _id: string;
  userId: string;
  locationId: string | null;
  eventId: string | null;
  createdAt: Date;
};

type MongoLocationDoc = Omit<Location, 'id'> & { _id: string };
type MongoEventDoc = Omit<Event, 'id'> & { _id: string; locationId: string };

export type FavoriteRecord = {
  id: string;
  userId: string;
  locationId: string | null;
  eventId: string | null;
  createdAt: Date;
};

export type FavoriteWithDetails = FavoriteRecord & {
  location: { id: string; name: string; images: string[] } | null;
  event: { id: string; title: string; locationName: string | null } | null;
};

const favoritesCollection = (): Collection<MongoFavorite> =>
  getMongoClient()!.db().collection<MongoFavorite>('user_favorites');

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const eventsCollection = (): Collection<MongoEventDoc> =>
  getMongoClient()!.db().collection<MongoEventDoc>('events');

const mapFavorite = (doc: MongoFavorite): FavoriteRecord => ({
  id: doc._id,
  userId: doc.userId,
  locationId: doc.locationId,
  eventId: doc.eventId,
  createdAt: doc.createdAt
});

export const listUserFavorites = async (userId: string): Promise<FavoriteRecord[]> => {
  const rows = await favoritesCollection().find({ userId }).sort({ createdAt: -1 }).toArray();
  return rows.map(mapFavorite);
};

export const createUserFavorite = async (input: {
  userId: string;
  locationId?: string;
  eventId?: string;
}): Promise<FavoriteRecord> => {
  const doc: MongoFavorite = {
    _id: randomUUID(),
    userId: input.userId,
    locationId: input.locationId ?? null,
    eventId: input.eventId ?? null,
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
  eventId?: string;
}): Promise<FavoriteRecord | null> => {
  const row = await favoritesCollection().findOne({
    userId: input.userId,
    ...(input.locationId ? { locationId: input.locationId } : {}),
    ...(input.eventId ? { eventId: input.eventId } : {})
  });
  return row ? mapFavorite(row) : null;
};

export const listUserFavoritesWithDetails = async (userId: string): Promise<FavoriteWithDetails[]> => {
  const favorites = await listUserFavorites(userId);
  if (favorites.length === 0) {
    return [];
  }

  const locationIds = [...new Set(favorites.map((f) => f.locationId).filter((id): id is string => Boolean(id)))];
  const eventIds = [...new Set(favorites.map((f) => f.eventId).filter((id): id is string => Boolean(id)))];

  const [locationDocs, eventDocs] = await Promise.all([
    locationIds.length > 0
      ? locationsCollection().find({ _id: { $in: locationIds } }, { projection: { name: 1, images: 1 } }).toArray()
      : Promise.resolve([]),
    eventIds.length > 0
      ? eventsCollection().find({ _id: { $in: eventIds } }, { projection: { title: 1, locationId: 1 } }).toArray()
      : Promise.resolve([])
  ]);

  const locationMap = new Map(locationDocs.map((location) => [location._id, location]));
  const eventLocationIds = [...new Set(eventDocs.map((event) => event.locationId))];
  const eventLocationDocs =
    eventLocationIds.length > 0
      ? await locationsCollection().find({ _id: { $in: eventLocationIds } }, { projection: { name: 1 } }).toArray()
      : [];
  const eventLocationMap = new Map(eventLocationDocs.map((location) => [location._id, location.name]));
  const eventMap = new Map(eventDocs.map((event) => [event._id, event]));

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
    event: favorite.eventId
      ? (() => {
          const event = eventMap.get(favorite.eventId);
          return event
            ? {
                id: event._id,
                title: event.title,
                locationName: eventLocationMap.get(event.locationId) ?? null
              }
            : null;
        })()
      : null
  }));
};

export const deleteUserFavoritesByUser = async (userId: string): Promise<void> => {
  await favoritesCollection().deleteMany({ userId });
};
