import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import type {
  CreateParticipantIntentInput,
  ParticipantIntentKind,
} from '../domain/participant-intent.js';
import { fromPrismaActivityType } from '../domain/activity-type.js';
import { ActivityStatus } from '../domain/enums.js';
import type { MongoActivityDoc } from '../lib/entity-builders.js';
import { COLLECTIONS } from '../lib/collections.js';
import { formatActivityLocal } from '../lib/datetime.js';
import { getMongoClient } from '../lib/mongo.js';

/**
 * COH-01 — Find posts only write `activities` (`activityMode: seeking`);
 * `/me/seeking-posts/*` read/manage via activity read-through (no `participant_intents` inserts).
 */
/** @deprecated Always false after MIG-COH-01 — env ignored. */
export const isParticipantIntentStubWriteEnabled = (): boolean => false;

const activitiesCollection = () =>
  getMongoClient()!.db().collection<MongoActivityDoc>(COLLECTIONS.ACTIVITIES);

export const findSeekingActivityByParticipantIntentId = async (
  intentId: string
): Promise<MongoActivityDoc | null> =>
  activitiesCollection().findOne({
    participantIntentId: intentId,
    activityMode: 'seeking',
  });

export const listSeekingActivitiesForOwner = async (
  userId: string,
  limit = 100
): Promise<MongoActivityDoc[]> =>
  activitiesCollection()
    .find({
      activityMode: 'seeking',
      participantIntentId: { $exists: true, $nin: [null, ''] },
      $or: [{ hostId: userId }, { createdById: userId }],
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

const resolveKindFromActivity = (activity: MongoActivityDoc): ParticipantIntentKind => {
  const shared = fromPrismaActivityType(activity.activityType ?? 'EVENT');
  if (shared === 'hiking') return 'hiking';
  if (shared === 'camping') return 'camping';
  if (shared === 'rideshare') return 'rideshare';
  if (activity.outingCategory === 'hiking') return 'hiking';
  if (activity.outingCategory === 'camping') return 'camping';
  if (activity.outingCategory === 'rideshare') return 'rideshare';
  return 'event';
};

const resolveIntentStatus = (
  activity: MongoActivityDoc
): 'active' | 'fulfilled' | 'cancelled' => {
  if (activity.seekingConvertedActivityId) return 'fulfilled';
  if (activity.status === ActivityStatus.CANCELLED) return 'cancelled';
  return 'active';
};

export const activityDocToParticipantIntentDto = (
  activity: MongoActivityDoc,
  user?: { profile?: { displayName?: string | null; avatarUrl?: string | null } } | null
): ParticipantIntentDTO => {
  const intentId = activity.participantIntentId?.trim();
  if (!intentId) {
    throw new Error('Seeking activity is missing participantIntentId.');
  }

  const { date, time } = formatActivityLocal(activity.startAt, 'AE');
  const isRideshare = resolveKindFromActivity(activity) === 'rideshare';

  return {
    id: intentId,
    userId: activity.hostId ?? activity.createdById,
    kind: resolveKindFromActivity(activity),
    title: activity.title.trim(),
    date,
    time,
    preferredArea: activity.meetingPoint,
    latitude: activity.meetingLat,
    longitude: activity.meetingLng,
    locationPrecision: null,
    toLatitude: isRideshare ? activity.startLat : null,
    toLongitude: isRideshare ? activity.startLng : null,
    partySize: activity.capacity,
    comment: activity.description,
    status: resolveIntentStatus(activity),
    convertedActivityId: activity.seekingConvertedActivityId ?? null,
    activityId: activity._id,
    seekingActivityId: activity._id,
    createdAt: activity.createdAt.toISOString(),
    requesterName: user?.profile?.displayName ?? null,
    requesterAvatar: user?.profile?.avatarUrl ?? null,
  };
};

export const resolveSeekingActivityOwnerId = (activity: MongoActivityDoc): string =>
  activity.hostId ?? activity.createdById;

export const isSeekingActivityEditable = (activity: MongoActivityDoc): boolean =>
  resolveIntentStatus(activity) === 'active';

export const seekingActivityToCreateInput = (
  activity: MongoActivityDoc
): CreateParticipantIntentInput => {
  const dto = activityDocToParticipantIntentDto(activity, null);
  return {
    kind: dto.kind,
    title: dto.title,
    date: dto.date,
    time: dto.time,
    preferredArea: dto.preferredArea,
    latitude: dto.latitude,
    longitude: dto.longitude,
    partySize: dto.partySize,
    comment: dto.comment,
    toLatitude: dto.toLatitude,
    toLongitude: dto.toLongitude,
    areaId: activity.areaId ?? null,
  };
};
