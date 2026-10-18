import { formatActivityLocal, parseLocalDateTime } from '../src/lib/datetime.js';
import { patchActivityInMongo } from '../src/lib/entity-sync.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { ActivityStatus } from '../src/domain/enums.js';
import type { MongoActivityDoc } from '../src/lib/entity-builders.js';

export const SEED_PARTICIPANT_INTENT_IDS = [
  'seed-demand-hike-hatta',
  'seed-demand-camp-fossil-rock',
  'seed-demand-event-kite-beach',
  'seed-demand-rideshare-dxb-rak',
] as const;

const DEFAULT_COUNTRY = 'AE';

const rollForwardDaysFromNow = (daysAhead: number): string =>
  new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

const seekingActivitiesCollection = () =>
  getMongoClient()!.db().collection<MongoActivityDoc>(COLLECTIONS.ACTIVITIES);

const resolveSeekingStartAt = (activity: MongoActivityDoc): Date | null => {
  if (!activity.startAt) return null;
  const startAt = activity.startAt instanceof Date ? activity.startAt : new Date(activity.startAt);
  return Number.isNaN(startAt.getTime()) ? null : startAt;
};

/**
 * Roll a seeking activity `startAt` forward when stale so demo / env maps stay populated.
 */
export const syncSeekingActivitySchedule = async (
  activity: MongoActivityDoc,
  options?: { daysAheadWhenStale?: number }
): Promise<{ synced: boolean; rolledForward: boolean }> => {
  const now = new Date();
  const daysAhead = options?.daysAheadWhenStale ?? 5;
  let startAt = resolveSeekingStartAt(activity);
  let rolledForward = false;

  if (!startAt || startAt < now) {
    rolledForward = true;
    const time = startAt ? formatActivityLocal(startAt, DEFAULT_COUNTRY).time : '09:00';
    const date = rollForwardDaysFromNow(daysAhead);
    startAt = parseLocalDateTime(date, time, DEFAULT_COUNTRY);
    await patchActivityInMongo(activity._id, { startAt });
  }

  return { synced: true, rolledForward };
};

const refreshSeekingActivitySchedules = async (
  activities: MongoActivityDoc[]
): Promise<{ updated: number; rolledForward: number }> => {
  let updated = 0;
  let rolledForward = 0;
  for (const activity of activities) {
    const result = await syncSeekingActivitySchedule(activity, { daysAheadWhenStale: 5 });
    if (result.synced) updated += 1;
    if (result.rolledForward) rolledForward += 1;
  }

  if (updated > 0) {
    await invalidateExploreMapCache();
  }

  return { updated, rolledForward };
};

/** Active Find posts — roll `activities.startAt` (demo + member-created seeking rows). */
export const refreshActiveParticipantSeekingSchedules = async (): Promise<{
  updated: number;
  rolledForward: number;
}> => {
  const activities = await seekingActivitiesCollection()
    .find({
      activityMode: 'seeking',
      participantIntentId: { $exists: true, $nin: [null, ''] },
      status: { $ne: ActivityStatus.CANCELLED },
    })
    .toArray();

  return refreshSeekingActivitySchedules(activities);
};

/**
 * After seed upserts demo seeking activities, roll `startAt` forward so
 * `GET /explore/map` stays populated (hosted outings use the same date-refresh pattern).
 */
export const refreshSeedParticipantSeekingSchedules = async (): Promise<{ updated: number }> => {
  const activities = await seekingActivitiesCollection()
    .find({
      activityMode: 'seeking',
      participantIntentId: { $in: [...SEED_PARTICIPANT_INTENT_IDS] },
    })
    .toArray();

  const result = await refreshSeekingActivitySchedules(activities);
  return { updated: result.updated };
};
