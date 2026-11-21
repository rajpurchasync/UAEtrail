import type {
  AvailabilityKind,
  MemberAvailabilitySlotDTO,
  ParticipantIntentDTO,
} from '@uaetrail/shared-types';
import { seekingFallbackTitle, type OutingCategory } from '@uaetrail/shared-types';
import {
  parseMergedParticipantIntent,
  type CreateParticipantIntentInput,
  type ParticipantIntentKind,
  type UpdateParticipantIntentInput,
} from '../domain/participant-intent.js';
import { findAuthUserById } from './auth-users-store.js';
import { parseLocalDateTime } from './datetime.js';
import { ApiError } from './api-error.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';
import { scheduleSideEffect } from './schedule-side-effect.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { ActivityStatus } from '../domain/enums.js';

type MongoParticipantIntent = {
  _id: string;
  userId: string;
  kind: ParticipantIntentKind;
  outingCategory?: OutingCategory | null;
  title?: string | null;
  date: string | null;
  time: string | null;
  preferredArea: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'general' | 'specific' | null;
  toLatitude: number | null;
  toLongitude: number | null;
  partySize: number;
  comment: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  convertedActivityId?: string | null;
  /** Canonical published activity id (`activityMode: seeking`). */
  activityId?: string | null;
  /** @deprecated Mongo alias — prefer `activityId`; kept for pre-rename rows. */
  seekingActivityId?: string | null;
  areaId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const collection = () => getMongoClient()!.db().collection<MongoParticipantIntent>(COLLECTIONS.PARTICIPANT_INTENTS);

const resolveStoredDemandTitle = (doc: MongoParticipantIntent): string =>
  doc.title?.trim() || seekingFallbackTitle(doc.kind);

export const findParticipantIntentById = async (
  intentId: string
): Promise<ParticipantIntentDTO | null> => {
  const { findSeekingActivityByParticipantIntentId, activityDocToParticipantIntentDto } =
    await import('../services/participant-intent-activity-readthrough.js');
  const activity = await findSeekingActivityByParticipantIntentId(intentId);
  if (!activity) return null;

  const user = await findAuthUserById(activity.hostId ?? activity.createdById);
  return activityDocToParticipantIntentDto(activity, user);
};

export const createParticipantIntent = async (
  _userId: string,
  _input: CreateParticipantIntentInput
): Promise<ParticipantIntentDTO> => {
  throw new ApiError(410, 'activity_mode_seeking_retired', 'Find crew uses PUT /me/availability.');
};

export const participantIntentDocToCreateInput = (
  doc: MongoParticipantIntent
): CreateParticipantIntentInput => ({
  kind: doc.kind,
  title: doc.title?.trim() || resolveStoredDemandTitle(doc),
  date: doc.date,
  time: doc.time,
  preferredArea: doc.preferredArea,
  latitude: doc.latitude,
  longitude: doc.longitude,
  locationPrecision: doc.locationPrecision ?? undefined,
  toLatitude: doc.toLatitude,
  toLongitude: doc.toLongitude,
  partySize: doc.partySize,
  comment: doc.comment,
  areaId: doc.areaId ?? null,
});

const patchSeekingActivityForOwner = async (
  userId: string,
  activity: MongoActivityDoc,
  patch: UpdateParticipantIntentInput
): Promise<ParticipantIntentDTO | null> => {
  const {
    isSeekingActivityEditable,
    resolveSeekingActivityOwnerId,
    seekingActivityToCreateInput,
    activityDocToParticipantIntentDto,
  } = await import('../services/participant-intent-activity-readthrough.js');
  if (resolveSeekingActivityOwnerId(activity) !== userId) return null;
  if (!isSeekingActivityEditable(activity)) return null;

  const baseInput = seekingActivityToCreateInput(activity);
  const merged = parseMergedParticipantIntent({
    ...baseInput,
    ...patch,
    title: patch.title?.trim() ?? baseInput.title,
    areaId:
      patch.areaId ??
      baseInput.areaId ??
      activity.areaId ??
      (baseInput.latitude != null && baseInput.longitude != null ? activity.areaId ?? null : null),
  });

  const areaId =
    merged.areaId?.trim() ||
    (merged.latitude != null && merged.longitude != null ? activity.areaId ?? null : null);

  const { patchActivityInMongo, findActivityDocInMongo } = await import('./entity-sync.js');
  const { parseLocalDateTime } = await import('./datetime.js');
  const startAt =
    merged.date != null
      ? parseLocalDateTime(merged.date, merged.time?.trim() || '09:00', 'AE')
      : undefined;
  await patchActivityInMongo(activity._id, {
    title: merged.title.trim(),
    description: merged.comment.trim(),
    capacity: merged.partySize,
    ...(startAt ? { startAt } : {}),
    meetingLat: merged.latitude ?? null,
    meetingLng: merged.longitude ?? null,
    meetingPoint: merged.preferredArea?.trim() || null,
    startLat: merged.toLatitude ?? null,
    startLng: merged.toLongitude ?? null,
    areaId,
  });

  scheduleExploreMapCacheInvalidation('participant-intents.map_cache');
  const refreshed = await findActivityDocInMongo(activity._id);
  if (!refreshed) return null;
  const user = await findAuthUserById(userId);
  return activityDocToParticipantIntentDto(refreshed, user);
};

export const updateParticipantIntent = async (
  userId: string,
  intentId: string,
  patch: UpdateParticipantIntentInput
): Promise<ParticipantIntentDTO | null> => {
  const {
    findSeekingActivityByParticipantIntentId,
  } = await import('../services/participant-intent-activity-readthrough.js');
  const seekingActivity = await findSeekingActivityByParticipantIntentId(intentId);
  if (!seekingActivity) return null;
  return patchSeekingActivityForOwner(userId, seekingActivity, patch);
};

export const cancelParticipantIntent = async (
  userId: string,
  intentId: string
): Promise<ParticipantIntentDTO | null> => {
  const {
    findSeekingActivityByParticipantIntentId,
    isSeekingActivityEditable,
    resolveSeekingActivityOwnerId,
    activityDocToParticipantIntentDto,
  } = await import('../services/participant-intent-activity-readthrough.js');
  const seekingActivity = await findSeekingActivityByParticipantIntentId(intentId);
  if (
    seekingActivity &&
    resolveSeekingActivityOwnerId(seekingActivity) === userId &&
    isSeekingActivityEditable(seekingActivity)
  ) {
    const { cancelSeekingActivityForIntent } = await import(
      '../services/participant-intent-activity-readthrough.js'
    );
    await cancelSeekingActivityForIntent(seekingActivity._id);

    scheduleExploreMapCacheInvalidation('participant-intents.map_cache');
    const { findActivityDocInMongo } = await import('./entity-sync.js');
    const refreshed = await findActivityDocInMongo(seekingActivity._id);
    if (!refreshed) return null;
    const user = await findAuthUserById(userId);
    return activityDocToParticipantIntentDto(refreshed, user);
  }

  return null;
};

/** @deprecated Import from `participant-intent-graduate-ops` (ops/tests only). */
export { linkParticipantIntentToActivityForOwner } from '../services/participant-intent-graduate-ops.js';

export const listParticipantIntentsForUser = async (
  userId: string,
  limit = 100
): Promise<ParticipantIntentDTO[]> => {
  const { listSeekingActivitiesForOwner, activityDocToParticipantIntentDto } = await import(
    '../services/participant-intent-activity-readthrough.js'
  );

  const user = await findAuthUserById(userId);
  return (await listSeekingActivitiesForOwner(userId, limit)).map((activity) =>
    activityDocToParticipantIntentDto(activity, user)
  );
};

/** Active looking-for posts — seeking activities only. */
export const countParticipantIntentsByUser = async (userId: string): Promise<number> => {
  const { countActiveSeekingActivitiesForOwner } = await import(
    '../services/participant-intent-activity-readthrough.js'
  );
  return countActiveSeekingActivitiesForOwner(userId);
};

const intentKindToAvailabilityKind = (kind: ParticipantIntentKind): AvailabilityKind => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'rideshare' || kind === 'event') return kind;
  return 'other';
};

const participantIntentDocToFixedSlot = (
  doc: MongoParticipantIntent,
  countryCode = 'AE'
): MemberAvailabilitySlotDTO | null => {
  if (doc.latitude == null || doc.longitude == null) return null;
  const day =
    doc.date?.trim() ||
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const time = doc.time?.trim() || '09:00';
  const startAt = parseLocalDateTime(day, time, countryCode).toISOString();
  return {
    slotId: doc._id,
    scheduleKind: 'fixed',
    startDate: day,
    endDate: day,
    startAt,
    endAt: startAt,
    title: resolveStoredDemandTitle(doc),
    latitude: doc.latitude,
    longitude: doc.longitude,
    locationPrecision: doc.locationPrecision ?? 'general',
    timeBand: null,
  };
};

/** Ops backfill — active legacy intents → fixed `member_availability` slots (no new seeking activities). */
export const backfillSeekingActivitiesForActiveIntents = async (options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<{ scanned: number; created: number; skipped: number; errors: string[] }> => {
  const limit = options?.limit ?? 500;
  const docs = await collection()
    .find({
      status: 'active',
      $and: [
        { $or: [{ activityId: { $exists: false } }, { activityId: null }] },
        { $or: [{ seekingActivityId: { $exists: false } }, { seekingActivityId: null }] },
      ],
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  const { mergeMemberAvailabilityFixedSlotsMigration } = await import(
    './member-availability-store.js'
  );

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    const slot = participantIntentDocToFixedSlot(doc);
    if (!slot) {
      skipped += 1;
      continue;
    }

    if (options?.dryRun) {
      created += 1;
      continue;
    }

    try {
      await mergeMemberAvailabilityFixedSlotsMigration(doc.userId, {
        kinds: [intentKindToAvailabilityKind(doc.kind)],
        visibility: 'public',
        areaId: doc.areaId ?? null,
        note: doc.comment?.trim() || null,
        fixedSlots: [slot],
      });
      await collection().updateOne(
        { _id: doc._id },
        {
          $set: {
            status: 'fulfilled',
            updatedAt: new Date(),
          },
        }
      );
      created += 1;
    } catch (error) {
      errors.push(`${doc._id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!options?.dryRun && created > 0) {
    scheduleExploreMapCacheInvalidation('participant-intents.map_cache');
  }

  return { scanned: docs.length, created, skipped, errors };
};
