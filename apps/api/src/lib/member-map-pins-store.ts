import { randomUUID } from 'crypto';
import type {
  CreateMemberMapPinInput,
  MemberMapPinDTO,
  MemberMapPinKind,
  UpdateMemberMapPinInput,
} from '@uaetrail/shared-types';
import { activityDetailPath, resolveActivityDisplayCoordinates } from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { findActivityDocInMongo, findLocationInMongo } from './entity-sync.js';
import { findActivityPrivateById } from './activity-private-store.js';
import { getMongoClient } from './mongo.js';
import { scheduleSideEffect } from './schedule-side-effect.js';
import {
  parseMemberMapPinActivityType,
  scheduledLocationToPinActivityType,
} from './member-map-pin-activity-type.js';

type MongoMemberMapPin = {
  _id: string;
  userId: string;
  kind: MemberMapPinKind;
  source: 'manual' | 'activity_check_in';
  title: string;
  placeDate: string;
  latitude: number;
  longitude: number;
  activityId: string | null;
  locationId: string | null;
  notes: string | null;
  activityType: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pinsCollection = () =>
  getMongoClient()!.db().collection<MongoMemberMapPin>(COLLECTIONS.MEMBER_MAP_PINS);

const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

const mapPinDto = (doc: MongoMemberMapPin): MemberMapPinDTO => ({
  id: doc._id,
  kind: doc.kind,
  source: doc.source,
  title: doc.title,
  placeDate: doc.placeDate,
  latitude: doc.latitude,
  longitude: doc.longitude,
  activityId: doc.activityId,
  locationId: doc.locationId,
  notes: doc.notes,
  activityType: doc.activityType,
  activityPath: doc.activityId ? activityDetailPath(doc.activityId) : null,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export const listMemberMapPinsForUser = async (userId: string): Promise<MemberMapPinDTO[]> => {
  const rows = await pinsCollection().find({ userId }).sort({ placeDate: -1, updatedAt: -1 }).toArray();
  return rows.map(mapPinDto);
};

export const createManualMemberMapPin = async (
  userId: string,
  input: CreateMemberMapPinInput
): Promise<MemberMapPinDTO> => {
  const placeDate = input.placeDate && ISO_DATE.test(input.placeDate) ? input.placeDate : todayIsoUtc();
  const title = (input.title?.trim() || 'Pinned place').slice(0, 200);
  const now = new Date();
  const doc: MongoMemberMapPin = {
    _id: randomUUID(),
    userId,
    kind: input.kind,
    source: 'manual',
    title,
    placeDate,
    latitude: input.latitude,
    longitude: input.longitude,
    activityId: null,
    locationId: null,
    notes: input.notes?.trim() ? input.notes.trim().slice(0, 2000) : null,
    activityType: parseMemberMapPinActivityType(input.activityType) ?? 'other',
    createdAt: now,
    updatedAt: now,
  };
  await pinsCollection().insertOne(doc);
  const dto = mapPinDto(doc);
  if (input.kind === 'visited') {
    scheduleSideEffect(
      import('../services/member-goal-notifications.js').then((mod) =>
        mod.notifyMemberGoalAfterProgress(userId)
      ),
      'member_map_pin.goal_progress'
    );
  }
  return dto;
};

export const updateMemberMapPin = async (
  userId: string,
  pinId: string,
  input: UpdateMemberMapPinInput
): Promise<MemberMapPinDTO> => {
  const existing = await pinsCollection().findOne({ _id: pinId, userId });
  if (!existing) {
    throw new ApiError(404, 'map_pin_not_found', 'Map pin not found.');
  }
  const patch: Partial<MongoMemberMapPin> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title.trim().slice(0, 200) || existing.title;
  if (input.placeDate !== undefined) {
    if (!ISO_DATE.test(input.placeDate)) {
      throw new ApiError(400, 'invalid_place_date', 'placeDate must be YYYY-MM-DD.');
    }
    patch.placeDate = input.placeDate;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes?.trim() ? input.notes.trim().slice(0, 2000) : null;
  }
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.activityType !== undefined) {
    patch.activityType =
      input.activityType === null
        ? null
        : parseMemberMapPinActivityType(input.activityType) ?? existing.activityType;
  }

  await pinsCollection().updateOne({ _id: pinId, userId }, { $set: patch });
  const updated = await pinsCollection().findOne({ _id: pinId, userId });
  if (!updated) {
    throw new ApiError(404, 'map_pin_not_found', 'Map pin not found.');
  }
  return mapPinDto(updated);
};

export const deleteMemberMapPin = async (userId: string, pinId: string): Promise<void> => {
  const result = await pinsCollection().deleteOne({ _id: pinId, userId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'map_pin_not_found', 'Map pin not found.');
  }
};

/** Idempotent — one visited pin per user + activity from check-in. */
export const upsertVisitedPinFromActivityCheckIn = async (input: {
  userId: string;
  activityId: string;
  checkedInAt: Date;
}): Promise<MemberMapPinDTO | null> => {
  const eventDoc = await findActivityDocInMongo(input.activityId);
  if (!eventDoc) return null;
  const location = await findLocationInMongo(eventDoc.locationId);
  if (!location) return null;

  const priv = await findActivityPrivateById(input.activityId);
  const exactLat = priv?.exactGeo?.coordinates ? (priv.exactGeo.coordinates[1] as number) : null;
  const exactLng = priv?.exactGeo?.coordinates ? (priv.exactGeo.coordinates[0] as number) : null;

  const { latitude, longitude } = resolveActivityDisplayCoordinates({
    meetingLat: exactLat ?? eventDoc.meetingLat,
    meetingLng: exactLng ?? eventDoc.meetingLng,
    startLat: eventDoc.startLat,
    startLng: eventDoc.startLng,
    parkingLat: eventDoc.parkingLat,
    parkingLng: eventDoc.parkingLng,
    locationLatitude: location.latitude ?? null,
    locationLongitude: location.longitude ?? null,
  });

  if (latitude == null || longitude == null) return null;

  const placeDate = input.checkedInAt.toISOString().slice(0, 10);
  const now = new Date();
  const activityType = scheduledLocationToPinActivityType(location.activityType);

  const existing = await pinsCollection().findOne({
    userId: input.userId,
    activityId: input.activityId,
    source: 'activity_check_in',
  });

  if (existing) {
    await pinsCollection().updateOne(
      { _id: existing._id },
      {
        $set: {
          kind: 'visited',
          title: eventDoc.title,
          placeDate,
          latitude,
          longitude,
          locationId: eventDoc.locationId,
          activityType,
          updatedAt: now,
        },
      }
    );
    const updated = await pinsCollection().findOne({ _id: existing._id });
    return updated ? mapPinDto(updated) : null;
  }

  const doc: MongoMemberMapPin = {
    _id: randomUUID(),
    userId: input.userId,
    kind: 'visited',
    source: 'activity_check_in',
    title: eventDoc.title,
    placeDate,
    latitude,
    longitude,
    activityId: input.activityId,
    locationId: eventDoc.locationId,
    notes: null,
    activityType,
    createdAt: now,
    updatedAt: now,
  };
  await pinsCollection().insertOne(doc);
  return mapPinDto(doc);
};

type CheckInRow = { activityId: string; checkedInAt: Date };

const participantsCollection = () =>
  getMongoClient()!.db().collection<{ userId: string; activityId: string; checkedInAt: Date | null }>(
    COLLECTIONS.ACTIVITY_PARTICIPANTS
  );

/** Backfill activity pins for historical check-ins missing a stored pin. */
export const syncActivityCheckInPinsForUser = async (userId: string): Promise<void> => {
  const rows = await participantsCollection()
    .find({ userId, checkedInAt: { $ne: null } })
    .project<CheckInRow>({ activityId: 1, checkedInAt: 1 })
    .toArray();

  const existingActivityIds = new Set(
    (
      await pinsCollection()
        .find({ userId, source: 'activity_check_in' })
        .project<{ activityId: string | null }>({ activityId: 1 })
        .toArray()
    )
      .map((p) => p.activityId)
      .filter(Boolean) as string[]
  );

  for (const row of rows) {
    if (!row.checkedInAt || existingActivityIds.has(row.activityId)) continue;
    const pin = await upsertVisitedPinFromActivityCheckIn({
      userId,
      activityId: row.activityId,
      checkedInAt: row.checkedInAt,
    });
    if (pin?.activityId) existingActivityIds.add(pin.activityId);
  }
};
