import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import type { ActivityStatus } from '../domain/enums.js';
import { ActivityStatus as ActivityStatusEnum } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { locationDocForMongo } from './location-query.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { invalidateExploreMapCache } from './explore-map-cache.js';

type MongoLocationDoc = Omit<Location, 'id'> & {
  _id: string;
  geo?: unknown;
};

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

export const writeLocationToMongo = async (location: Location): Promise<void> => {
  await locationsCollection().updateOne(
    { _id: location.id },
    { $set: locationDocForMongo(location) },
    { upsert: true }
  );
  await invalidateExploreMapCache();
};

export const deleteLocationFromMongo = async (locationId: string): Promise<boolean> => {
  const result = await locationsCollection().deleteOne({ _id: locationId });
  if (result.deletedCount > 0) {
    await invalidateExploreMapCache();
  }
  return result.deletedCount > 0;
};

export const writeActivityDocToMongo = async (doc: MongoActivityDoc): Promise<void> => {
  await activitiesCollection().updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
};

export const patchActivityInMongo = async (
  activityId: string,
  patch: Partial<Omit<MongoActivityDoc, '_id'>>
): Promise<void> => {
  await activitiesCollection().updateOne(
    { _id: activityId },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

export const findActivityDocInMongo = async (activityId: string): Promise<MongoActivityDoc | null> =>
  activitiesCollection().findOne({ _id: activityId });

export const findLocationByExternalRef = async (
  externalSource: NonNullable<Location['externalSource']>,
  externalId: string
): Promise<Location | null> => {
  const doc = await locationsCollection().findOne({ externalSource, externalId });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

export const deleteActivityDocInMongo = async (activityId: string): Promise<boolean> => {
  const result = await activitiesCollection().deleteOne({ _id: activityId });
  return result.deletedCount > 0;
};

/** Atomically reserve one participant slot when capacity allows. */
export const tryReserveActivityParticipantSlot = async (
  activityId: string,
  status: ActivityStatus = ActivityStatusEnum.PUBLISHED
): Promise<boolean> => {
  const result = await activitiesCollection().findOneAndUpdate(
    {
      _id: activityId,
      status,
      $expr: { $lt: [{ $ifNull: ['$participantSlotsUsed', 0] }, '$capacity'] }
    },
    [
      {
        $set: {
          participantSlotsUsed: { $add: [{ $ifNull: ['$participantSlotsUsed', 0] }, 1] },
          updatedAt: new Date()
        }
      }
    ],
    { returnDocument: 'after' }
  );
  return Boolean(result);
};

/** Release a reserved participant slot (e.g. when a participant is removed). */
export const releaseActivityParticipantSlot = async (activityId: string): Promise<void> => {
  await activitiesCollection().updateOne(
    { _id: activityId, participantSlotsUsed: { $gt: 0 } },
    { $inc: { participantSlotsUsed: -1 }, $set: { updatedAt: new Date() } }
  );
};

export const findLocationInMongo = async (locationId: string): Promise<Location | null> => {
  const doc = await locationsCollection().findOne({ _id: locationId });
  if (!doc) return null;
  const { _id, geo: _geo, ...rest } = doc;
  return { id: _id, ...rest };
};

export const findLocationsByIds = async (locationIds: string[]): Promise<Map<string, Location>> => {
  const unique = [...new Set(locationIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const docs = await locationsCollection().find({ _id: { $in: unique } }).toArray();
  const map = new Map<string, Location>();
  for (const doc of docs) {
    const { _id, geo: _geo, ...rest } = doc;
    map.set(_id, { id: _id, ...rest });
  }
  return map;
};

export const mapMongoActivityToPublishResult = (doc: MongoActivityDoc) => ({
  id: doc._id,
  tenantId: doc.tenantId,
  locationId: doc.locationId,
  createdById: doc.createdById,
  hostId: doc.hostId,
  title: doc.title,
  startAt: doc.startAt,
  endAt: doc.endAt,
  status: doc.status as ActivityStatus,
  featured: doc.featured,
  publishedAt: doc.publishedAt,
  capacity: doc.capacity,
  priceAed: doc.priceAed,
  updatedAt: doc.updatedAt
});
