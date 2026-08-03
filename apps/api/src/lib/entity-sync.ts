import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import type { EventStatus } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { locationDocForMongo } from './location-query.js';
import type { MongoEventDoc } from './entity-builders.js';

type MongoLocationDoc = Omit<Location, 'id'> & {
  _id: string;
  geo?: unknown;
};

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const eventsCollection = (): Collection<MongoEventDoc> =>
  getMongoClient()!.db().collection<MongoEventDoc>('events');

export const writeLocationToMongo = async (location: Location): Promise<void> => {
  await locationsCollection().updateOne(
    { _id: location.id },
    { $set: locationDocForMongo(location) },
    { upsert: true }
  );
};

export const writeEventDocToMongo = async (doc: MongoEventDoc): Promise<void> => {
  await eventsCollection().updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
};

export const patchEventInMongo = async (
  eventId: string,
  patch: Partial<Omit<MongoEventDoc, '_id'>>
): Promise<void> => {
  await eventsCollection().updateOne(
    { _id: eventId },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

export const findEventDocInMongo = async (eventId: string): Promise<MongoEventDoc | null> =>
  eventsCollection().findOne({ _id: eventId });

export const findLocationInMongo = async (locationId: string): Promise<Location | null> => {
  const doc = await locationsCollection().findOne({ _id: locationId });
  if (!doc) return null;
  const { _id, geo: _geo, ...rest } = doc;
  return { id: _id, ...rest };
};

export const mapMongoEventToPublishResult = (doc: MongoEventDoc) => ({
  id: doc._id,
  tenantId: doc.tenantId,
  locationId: doc.locationId,
  createdById: doc.createdById,
  guideId: doc.guideId,
  title: doc.title,
  startAt: doc.startAt,
  endAt: doc.endAt,
  status: doc.status as EventStatus,
  featured: doc.featured,
  publishedAt: doc.publishedAt,
  capacity: doc.capacity,
  priceAed: doc.priceAed,
  updatedAt: doc.updatedAt
});
