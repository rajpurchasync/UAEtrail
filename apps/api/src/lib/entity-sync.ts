import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import type { ActivityStatus } from '../domain/enums.js';
import { ActivityStatus as ActivityStatusEnum } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { activityGeoIndexFields } from './geo-index-fields.js';
import { locationDocForMongo } from './location-query.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { invalidateExploreMapCache } from './explore-map-cache.js';

type MongoLocationDoc = Omit<Location, 'id'> & {
  _id: string;
  geo?: unknown;
  groupRegionBrowseKey?: string | null;
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

export const enrichActivityDocForMongo = (
  doc: MongoActivityDoc,
  opts?: { countryCode?: string; location?: Pick<Location, 'latitude' | 'longitude'> | null }
): MongoActivityDoc & { geo?: { type: 'Point'; coordinates: [number, number] }; groupRegionBrowseKey?: string | null } => {
  const countryCode = opts?.countryCode ?? 'AE';
  const indexFields = activityGeoIndexFields(doc, countryCode, opts?.location ?? null);
  return { ...doc, ...indexFields };
};

export const writeActivityDocToMongo = async (
  doc: MongoActivityDoc,
  opts?: { countryCode?: string; location?: Pick<Location, 'latitude' | 'longitude'> | null }
): Promise<void> => {
  const payload = enrichActivityDocForMongo(doc, opts);
  await activitiesCollection().updateOne({ _id: doc._id }, { $set: payload }, { upsert: true });
};

export const patchActivityInMongo = async (
  activityId: string,
  patch: Partial<Omit<MongoActivityDoc, '_id'>>,
  indexOpts?: { countryCode?: string; location?: Pick<Location, 'latitude' | 'longitude'> | null }
): Promise<void> => {
  const existing = await findActivityDocInMongo(activityId);
  const indexFields = existing
    ? activityGeoIndexFields(
        { ...existing, ...patch },
        indexOpts?.countryCode ?? 'AE',
        indexOpts?.location ?? null
      )
    : {};
  await activitiesCollection().updateOne(
    { _id: activityId },
    { $set: { ...patch, ...indexFields, updatedAt: new Date() } }
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
  const { _id, geo: _geo, groupRegionBrowseKey: _browseKey, ...rest } = doc;
  return { id: _id, ...rest };
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
