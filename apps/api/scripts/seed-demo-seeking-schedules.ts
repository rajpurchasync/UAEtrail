import { formatActivityLocal, parseLocalDateTime } from '../src/lib/datetime.js';
import { patchActivityInMongo } from '../src/lib/entity-sync.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';

export const SEED_PARTICIPANT_INTENT_IDS = [
  'seed-demand-hike-hatta',
  'seed-demand-camp-fossil-rock',
  'seed-demand-event-kite-beach',
  'seed-demand-rideshare-dxb-rak',
] as const;

const DEFAULT_COUNTRY = 'AE';

const resolveSeekingStartAt = (intent: {
  date?: string | null;
  time?: string | null;
}): Date | null => {
  const date = intent.date?.trim();
  if (!date) return null;
  const time = intent.time?.trim() || '09:00';
  return parseLocalDateTime(date, time, DEFAULT_COUNTRY);
};

const rollForwardDaysFromNow = (daysAhead: number): string =>
  new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

type IntentDoc = {
  _id: string;
  date?: string | null;
  time?: string | null;
  seekingActivityId?: string | null;
  activityId?: string | null;
  updatedAt?: Date;
};

/**
 * Sync intent schedule → linked seeking activity. Rolls stale intent dates forward.
 */
export const syncActiveParticipantIntentSeekingSchedule = async (
  intent: IntentDoc,
  options?: { daysAheadWhenStale?: number }
): Promise<{ synced: boolean; rolledForward: boolean }> => {
  const activityId = (intent.seekingActivityId ?? intent.activityId) as string | undefined;
  if (!activityId) return { synced: false, rolledForward: false };

  const now = new Date();
  const daysAhead = options?.daysAheadWhenStale ?? 5;
  let rolledForward = false;
  let date = intent.date?.trim() ?? '';
  let time = intent.time?.trim() || '09:00';
  let startAt = date ? resolveSeekingStartAt(intent) : null;

  if (!startAt || startAt < now) {
    rolledForward = true;
    date = rollForwardDaysFromNow(daysAhead);
    startAt = parseLocalDateTime(date, time, DEFAULT_COUNTRY);
    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .updateOne(
        { _id: intent._id },
        {
          $set: {
            date,
            updatedAt: new Date(),
          },
        }
      );
  }

  if (!startAt) {
    startAt = new Date();
    startAt.setDate(startAt.getDate() + 30);
    startAt.setHours(9, 0, 0, 0);
    const local = formatActivityLocal(startAt, DEFAULT_COUNTRY);
    date = local.date;
    time = local.time;
    rolledForward = true;
    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .updateOne(
        { _id: intent._id },
        {
          $set: {
            date,
            time,
            updatedAt: new Date(),
          },
        }
      );
  }

  await patchActivityInMongo(activityId, { startAt });
  return { synced: true, rolledForward };
};

/** All active Find posts — intent dates + `activities.startAt` (demo + member-created). */
export const refreshActiveParticipantSeekingSchedules = async (): Promise<{
  updated: number;
  rolledForward: number;
}> => {
  const intents = await getMongoClient()!
    .db()
    .collection(COLLECTIONS.PARTICIPANT_INTENTS)
    .find({ status: 'active' })
    .toArray();

  let updated = 0;
  let rolledForward = 0;
  for (const intent of intents) {
    const result = await syncActiveParticipantIntentSeekingSchedule(intent as IntentDoc, {
      daysAheadWhenStale: 5,
    });
    if (result.synced) updated += 1;
    if (result.rolledForward) rolledForward += 1;
  }

  if (updated > 0) {
    await invalidateExploreMapCache();
  }

  return { updated, rolledForward };
};

/**
 * After seed upserts demo intents, roll linked `activityMode: seeking` rows forward so
 * `GET /explore/map` stays populated (hosted outings use the same date-refresh pattern).
 */
export const refreshSeedParticipantSeekingSchedules = async (): Promise<{ updated: number }> => {
  const intents = await getMongoClient()!
    .db()
    .collection(COLLECTIONS.PARTICIPANT_INTENTS)
    .find({ _id: { $in: [...SEED_PARTICIPANT_INTENT_IDS] }, status: 'active' })
    .toArray();

  let updated = 0;
  for (const intent of intents) {
    const result = await syncActiveParticipantIntentSeekingSchedule(intent as IntentDoc, {
      daysAheadWhenStale: 5,
    });
    if (result.synced) updated += 1;
  }

  if (updated > 0) {
    await invalidateExploreMapCache();
  }

  return { updated };
};
