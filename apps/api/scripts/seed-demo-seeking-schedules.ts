import { parseLocalDateTime } from '../src/lib/datetime.js';
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

const resolveSeekingStartAt = (intent: {
  date?: string | null;
  time?: string | null;
}): Date | null => {
  const date = intent.date?.trim();
  if (!date) return null;
  const time = intent.time?.trim() || '09:00';
  return parseLocalDateTime(date, time, 'AE');
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
    const activityId = (intent.seekingActivityId ?? intent.activityId) as string | undefined;
    const startAt = resolveSeekingStartAt(intent);
    if (!activityId || !startAt) continue;
    await patchActivityInMongo(activityId, { startAt });
    updated += 1;
  }

  if (updated > 0) {
    await invalidateExploreMapCache();
  }

  return { updated };
};
