import { randomUUID } from 'crypto';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { seekingFallbackTitle, type OutingCategory } from '@uaetrail/shared-types';
import {
  parseMergedParticipantIntent,
  type CreateParticipantIntentInput,
  type ParticipantIntentKind,
  type UpdateParticipantIntentInput,
} from '../domain/participant-intent.js';
import { findAuthUserById } from './auth-users-store.js';
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

/** Map-published activity for an intent (seeking mode). Not the later `convertedActivityId` hosted link. */
export const resolveIntentPublishedActivityId = (
  doc: Pick<MongoParticipantIntent, 'activityId' | 'seekingActivityId'>
): string | null => doc.activityId ?? doc.seekingActivityId ?? null;

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
  userId: string,
  input: CreateParticipantIntentInput
): Promise<ParticipantIntentDTO> => {
  const areaId = input.areaId?.trim() ? input.areaId.trim() : null;
  if (input.latitude != null && input.longitude != null) {
    if (!areaId) {
      const { ApiError } = await import('./api-error.js');
      throw new ApiError(400, 'activity_area_required', 'Choose a curated area for this map post.');
    }
    const { findPublishedAreaById } = await import('./areas-store.js');
    const area = await findPublishedAreaById(areaId);
    if (!area) {
      const { ApiError } = await import('./api-error.js');
      throw new ApiError(400, 'area_not_found', 'Choose a published area.');
    }
  }
  const intentId = randomUUID();
  const { createSeekingActivityForIntent, cancelSeekingActivityForIntent } = await import(
    '../services/participant-intent-seeking-activity.js'
  );
  const publishedActivityId = await createSeekingActivityForIntent(userId, intentId, input, areaId);

  const { activityDocToParticipantIntentDto } = await import(
    '../services/participant-intent-activity-readthrough.js'
  );

  scheduleExploreMapCacheInvalidation('participant-intents.map_cache');
  const { notifyMemberPublishSubscribers } = await import('../services/member-publish-notifications.js');
  void notifyMemberPublishSubscribers(userId, {
    publishType: 'seeking',
    intentId,
    title: input.title.trim(),
    activityId: publishedActivityId,
  });
  const { notifyWishlistForNewSeeking } = await import('../services/wishlist-alerts.js');
  scheduleSideEffect(
    notifyWishlistForNewSeeking(intentId, userId),
    'participant-intents.wishlist_notify'
  );
  if (areaId) {
    const { notifySeekerOfHostedActivitiesInArea } = await import(
      '../services/seeking-area-match-notifications.js'
    );
    void notifySeekerOfHostedActivitiesInArea({
      seekerUserId: userId,
      areaId,
      intentId,
      seekingActivityId: publishedActivityId,
      intentDate: input.date ?? null,
    });
  }
  const { findActivityDocInMongo } = await import('./entity-sync.js');
  const activity = await findActivityDocInMongo(publishedActivityId);
  if (!activity) {
    await cancelSeekingActivityForIntent(publishedActivityId);
    throw new Error('Seeking activity missing after create.');
  }
  const user = await findAuthUserById(userId);
  return activityDocToParticipantIntentDto(activity, user);
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
      '../services/participant-intent-seeking-activity.js'
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

/** Poster links their published activity to close the demand pin. */
export const linkParticipantIntentToActivityForOwner = async (
  intentId: string,
  ownerUserId: string,
  activityId: string
): Promise<ParticipantIntentDTO | null> => {
  const { findActivityDocInMongo } = await import('./entity-sync.js');
  const activity = await findActivityDocInMongo(activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const activityOwnerId = activity.hostId ?? activity.createdById;
  if (activityOwnerId !== ownerUserId) {
    throw new ApiError(403, 'not_activity_owner', 'You can only link your own published outing.');
  }

  const {
    findSeekingActivityByParticipantIntentId,
    isSeekingActivityEditable,
    resolveSeekingActivityOwnerId,
  } = await import('../services/participant-intent-activity-readthrough.js');
  const seeking = await findSeekingActivityByParticipantIntentId(intentId);
  if (
    !seeking ||
    resolveSeekingActivityOwnerId(seeking) !== ownerUserId ||
    !isSeekingActivityEditable(seeking)
  ) {
    throw new ApiError(404, 'intent_not_found', 'Looking-for post not found or already closed.');
  }

  return fulfillParticipantIntent(intentId, activityId);
};

export const fulfillParticipantIntent = async (
  intentId: string,
  activityId: string
): Promise<ParticipantIntentDTO | null> => {
  const {
    findSeekingActivityByParticipantIntentId,
    isSeekingActivityEditable,
    activityDocToParticipantIntentDto,
  } = await import('../services/participant-intent-activity-readthrough.js');
  const seeking = await findSeekingActivityByParticipantIntentId(intentId);
  if (!seeking || !isSeekingActivityEditable(seeking)) return null;

  const hostUserId = seeking.hostId ?? seeking.createdById;
  const { patchActivityInMongo } = await import('./entity-sync.js');
  await patchActivityInMongo(seeking._id, {
    status: ActivityStatus.CANCELLED,
    seekingConvertedActivityId: activityId,
  });

  const { carryApprovedDemandJoinersToActivity } = await import(
    '../services/participant-intent-carryover.js'
  );
  await carryApprovedDemandJoinersToActivity({
    intentId,
    activityId,
    hostUserId,
  });

  scheduleExploreMapCacheInvalidation('participant-intents.map_cache');
  const { findActivityDocInMongo } = await import('./entity-sync.js');
  const refreshed = await findActivityDocInMongo(seeking._id);
  if (!refreshed) return null;
  const user = await findAuthUserById(hostUserId);
  return activityDocToParticipantIntentDto(refreshed, user);
};

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

/** M1 backfill — active intents without published `activityId` (pre-dual-write rows). */
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

  const { createSeekingActivityForIntent } = await import(
    '../services/participant-intent-seeking-activity.js'
  );

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    if (doc.latitude == null || doc.longitude == null) {
      skipped += 1;
      continue;
    }

    if (options?.dryRun) {
      created += 1;
      continue;
    }

    const input = participantIntentDocToCreateInput(doc);
    try {
      const publishedActivityId = await createSeekingActivityForIntent(
        doc.userId,
        doc._id,
        input,
        doc.areaId ?? null,
        { deferCacheInvalidate: true }
      );
      await collection().updateOne(
        { _id: doc._id },
        {
          $set: {
            activityId: publishedActivityId,
            seekingActivityId: publishedActivityId,
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
