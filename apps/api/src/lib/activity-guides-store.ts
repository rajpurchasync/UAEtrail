import type { ActivityGuideRecord } from '../domain/types.js';
import { findActivityDocInMongo, patchActivityInMongo } from './entity-sync.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';

export const readActivityGuides = async (activityId: string): Promise<ActivityGuideRecord[]> => {
  const doc = await findActivityDocInMongo(activityId);
  return doc?.guides ?? [];
};

export const writeActivityGuides = async (
  activityId: string,
  guides: ActivityGuideRecord[]
): Promise<void> => {
  await patchActivityInMongo(activityId, { guides });
  const existing = await findActivityDocInMongo(activityId);
  if (existing?.status === 'PUBLISHED') {
    scheduleExploreMapCacheInvalidation('activity-guides.map_cache');
  }
};
