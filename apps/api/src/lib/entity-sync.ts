import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import type { ActivityStatus } from '../domain/enums.js';
import { ActivityStatus as ActivityStatusEnum } from '../domain/enums.js';
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
  getMongoClient()!.db().collection<MongoEventDoc>('activities');

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
  activityId: string,
  patch: Partial<Omit<MongoEventDoc, '_id'>>
): Promise<void> => {
  await eventsCollection().updateOne(
    { _id: activityId },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

export const findEventDocInMongo = async (activityId: string): Promise<MongoEventDoc | null> =>
  eventsCollection().findOne({ _id: activityId });

/** Atomically reserve one participant slot when capacity allows. */
export const tryReserveEventParticipantSlot = async (
  activityId: string,
  status: ActivityStatus = ActivityStatusEnum.PUBLISHED
): Promise<boolean> => {
  const result = await eventsCollection().findOneAndUpdate(
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
export const releaseEventParticipantSlot = async (activityId: string): Promise<void> => {
  await eventsCollection().updateOne(
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

export const mapMongoEventToPublishResult = (doc: MongoEventDoc) => ({
  id: doc._id,
  tenantId: doc.tenantId,
  locationId: doc.locationId,
  createdById: doc.createdById,
  guideId: doc.guideId,
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
