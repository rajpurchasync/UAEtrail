import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import type { ActivityStatus } from '../domain/enums.js';
import { ActivityStatus as ActivityStatusEnum } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';
import { activityGeoIndexFields } from './geo-index-fields.js';
import { locationDocForMongo } from './location-query.js';
import {
  activityToCountedPin,
  attachGeoRefToActivity,
  attachGeoRefToLocation,
  emitGeoPinChange,
  locationToCountedPin,
} from './geo-write.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';
import {
  enrichLocationWithHeavyReads,
  enrichLocationsWithHeavyReadsBatch,
  persistPlaceHeavyFieldsFromLocationWrite,
  stripHeavyFieldsFromLocationMongoDoc,
} from './place-heavy-store.js';
import { upsertActivityPrivateFromMeetingFields } from './activity-private-store.js';
import { meetingPairForActivityShell } from './activity-meeting-shell.js';

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
  await persistPlaceHeavyFieldsFromLocationWrite({
    placeId: location.id,
    gpxKey: location.gpxKey,
    guideMarkdown: location.guideMarkdown,
  });
  const beforeDoc = await locationsCollection().findOne({ _id: location.id });
  const beforePin = beforeDoc
    ? locationToCountedPin({
        activityType: beforeDoc.activityType,
        status: beforeDoc.status,
        geoRef: beforeDoc.geoRef ?? null,
      })
    : null;
  await attachGeoRefToLocation(location);
  const doc = stripHeavyFieldsFromLocationMongoDoc(locationDocForMongo(location));
  await locationsCollection().updateOne({ _id: location.id }, { $set: doc }, { upsert: true });
  await emitGeoPinChange(beforePin, locationToCountedPin(location));
  scheduleExploreMapCacheInvalidation('entity-sync.location_write_map_cache');
};

export const deleteLocationFromMongo = async (locationId: string): Promise<boolean> => {
  const result = await locationsCollection().deleteOne({ _id: locationId });
  if (result.deletedCount > 0) {
    const db = getMongoClient()!.db();
    await Promise.all([
      db.collection<{ _id: string }>(COLLECTIONS.PLACE_TRACKS).deleteOne({ _id: locationId }),
      db.collection<{ _id: string }>(COLLECTIONS.PLACE_GUIDES).deleteOne({ _id: locationId }),
    ]);
    scheduleExploreMapCacheInvalidation('entity-sync.location_delete_map_cache');
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
  const shellMeeting = meetingPairForActivityShell(doc.meetingLat, doc.meetingLng);
  const docForMongo = { ...doc, ...shellMeeting };
  const payload = enrichActivityDocForMongo(docForMongo, opts);
  const before = await findActivityDocInMongo(doc._id);
  await attachGeoRefToActivity(payload, opts?.location ?? null);
  await activitiesCollection().updateOne({ _id: doc._id }, { $set: payload }, { upsert: true });
  await emitGeoPinChange(before ? activityToCountedPin(before) : null, activityToCountedPin(payload));
  await upsertActivityPrivateFromMeetingFields({
    activityId: doc._id,
    meetingLat: doc.meetingLat,
    meetingLng: doc.meetingLng,
    meetingNotes: doc.meetingPoint,
  });
};

export const patchActivityInMongo = async (
  activityId: string,
  patch: Partial<Omit<MongoActivityDoc, '_id'>>,
  indexOpts?: { countryCode?: string; location?: Pick<Location, 'latitude' | 'longitude'> | null }
): Promise<void> => {
  const existing = await findActivityDocInMongo(activityId);
  const merged = existing ? { ...existing, ...patch } : null;
  const shellMeeting = merged ? meetingPairForActivityShell(merged.meetingLat, merged.meetingLng) : null;
  const mergedForIndex =
    merged && shellMeeting ? { ...merged, ...shellMeeting } : merged;
  const indexFields = mergedForIndex
    ? activityGeoIndexFields(
        mergedForIndex,
        indexOpts?.countryCode ?? 'AE',
        indexOpts?.location ?? null
      )
    : {};
  const setPayload: Record<string, unknown> = { ...patch, ...indexFields, updatedAt: new Date() };
  if (merged && shellMeeting) {
    setPayload.meetingLat = shellMeeting.meetingLat;
    setPayload.meetingLng = shellMeeting.meetingLng;
  }
  if (mergedForIndex) {
    await attachGeoRefToActivity(mergedForIndex as MongoActivityDoc, indexOpts?.location ?? null);
    setPayload.geoRef = mergedForIndex.geoRef;
  }
  await activitiesCollection().updateOne({ _id: activityId }, { $set: setPayload });
  if (mergedForIndex) {
    await emitGeoPinChange(
      existing ? activityToCountedPin(existing) : null,
      activityToCountedPin(mergedForIndex as MongoActivityDoc)
    );
  }
  if (merged) {
    await upsertActivityPrivateFromMeetingFields({
      activityId,
      meetingLat: merged.meetingLat,
      meetingLng: merged.meetingLng,
      meetingNotes: merged.meetingPoint,
    });
  }
};

export const findActivityDocInMongo = async (activityId: string): Promise<MongoActivityDoc | null> =>
  activitiesCollection().findOne({ _id: activityId });

export const findLocationByExternalRef = async (
  externalSource: NonNullable<Location['externalSource']>,
  externalId: string
): Promise<Location | null> => {
  const doc = await locationsCollection().findOne({ externalSource, externalId });
  if (!doc) return null;
  const { _id, geo: _geo, groupRegionBrowseKey: _b, ...rest } = doc;
  return enrichLocationWithHeavyReads({ id: _id, ...rest } as Location);
};

export const deleteActivityDocInMongo = async (activityId: string): Promise<boolean> => {
  const result = await activitiesCollection().deleteOne({ _id: activityId });
  if (result.deletedCount > 0) {
    await getMongoClient()!.db().collection<{ _id: string }>(COLLECTIONS.ACTIVITY_PRIVATE).deleteOne({
      _id: activityId,
    });
  }
  return result.deletedCount > 0;
};

/** Atomically reserve party headcount against activity capacity. */
export const tryReserveActivityParticipantSlots = async (
  activityId: string,
  count: number,
  status: ActivityStatus = ActivityStatusEnum.PUBLISHED
): Promise<boolean> => {
  if (!Number.isFinite(count) || count < 1) return false;
  const result = await activitiesCollection().findOneAndUpdate(
    {
      _id: activityId,
      status,
      $expr: {
        $lte: [{ $add: [{ $ifNull: ['$participantSlotsUsed', 0] }, count] }, '$capacity'],
      },
    },
    [
      {
        $set: {
          participantSlotsUsed: { $add: [{ $ifNull: ['$participantSlotsUsed', 0] }, count] },
          'counts.going': { $add: [{ $ifNull: ['$counts.going', 0] }, count] },
          updatedAt: new Date(),
        },
      },
    ],
    { returnDocument: 'after' }
  );
  return Boolean(result);
};

/** @deprecated Use {@link tryReserveActivityParticipantSlots} with explicit headcount. */
export const tryReserveActivityParticipantSlot = async (
  activityId: string,
  status: ActivityStatus = ActivityStatusEnum.PUBLISHED
): Promise<boolean> => tryReserveActivityParticipantSlots(activityId, 1, status);

/** Release party headcount (e.g. when a participant row is removed). */
export const releaseActivityParticipantSlots = async (
  activityId: string,
  count: number
): Promise<void> => {
  if (!Number.isFinite(count) || count < 1) return;
  await activitiesCollection().updateOne({ _id: activityId }, [
    {
      $set: {
        participantSlotsUsed: {
          $max: [0, { $subtract: [{ $ifNull: ['$participantSlotsUsed', 0] }, count] }],
        },
        'counts.going': {
          $max: [0, { $subtract: [{ $ifNull: ['$counts.going', 0] }, count] }],
        },
        updatedAt: new Date(),
      },
    },
  ]);
};

/** @deprecated Use {@link releaseActivityParticipantSlots} with explicit headcount. */
export const releaseActivityParticipantSlot = async (activityId: string): Promise<void> => {
  await releaseActivityParticipantSlots(activityId, 1);
};

export const incrementActivityCounts = async (
  activityId: string,
  delta: { going?: number; waitlisted?: number; pending?: number }
): Promise<void> => {
  const inc: Record<string, number> = {};
  if (delta.going) inc['counts.going'] = delta.going;
  if (delta.waitlisted) inc['counts.waitlisted'] = delta.waitlisted;
  if (delta.pending) inc['counts.pending'] = delta.pending;
  if (Object.keys(inc).length === 0) return;
  await activitiesCollection().updateOne(
    { _id: activityId },
    { $inc: inc, $set: { updatedAt: new Date() } }
  );
};

export const findLocationInMongo = async (locationId: string): Promise<Location | null> => {
  const doc = await locationsCollection().findOne({ _id: locationId });
  if (!doc) return null;
  const { _id, geo: _geo, groupRegionBrowseKey: _browseKey, ...rest } = doc;
  const base = { id: _id, ...rest } as Location;
  return enrichLocationWithHeavyReads(base);
};

export const findLocationsByIds = async (locationIds: string[]): Promise<Map<string, Location>> => {
  const unique = [...new Set(locationIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const docs = await locationsCollection().find({ _id: { $in: unique } }).toArray();
  const bases = docs.map((doc) => {
    const { _id, geo: _geo, ...rest } = doc;
    return { id: _id, ...rest } as Location;
  });
  const enriched = await enrichLocationsWithHeavyReadsBatch(bases);
  const map = new Map<string, Location>();
  for (const loc of enriched) {
    map.set(loc.id, loc);
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
