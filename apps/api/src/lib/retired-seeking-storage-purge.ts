import type { Db } from 'mongodb';
import { ActivityStatus } from '../domain/enums.js';
import { mongoOnlyRetiredSeekingActivityMode } from '../domain/retired-seeking-activity-mode.js';
import { COLLECTIONS } from './collections.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';

export type RetiredSeekingStoragePurgeReport = {
  participantIntentsCancelled: number;
  participantIntentRequestsDeleted: number;
  seekingActivitiesRetired: number;
  participantIntentFieldsUnset: number;
};

/**
 * Idempotent storage cleanup — cancels retired Find-as-activity rows and strips `participantIntentId`.
 * Prefer `purge-seeking-legacy-storage` CLI (backfill + slot migrate) before this when preserving map pins.
 */
export const purgeRetiredSeekingStorage = async (
  db: Db,
  options?: { dryRun?: boolean }
): Promise<RetiredSeekingStoragePurgeReport> => {
  const dryRun = options?.dryRun ?? false;
  const now = new Date();
  const intents = db.collection(COLLECTIONS.PARTICIPANT_INTENTS);
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  const intentRequests = db.collection(COLLECTIONS.PARTICIPANT_INTENT_REQUESTS);

  let participantIntentsCancelled = 0;
  let participantIntentRequestsDeleted = 0;
  let seekingActivitiesRetired = 0;
  let participantIntentFieldsUnset = 0;

  const activeIntentFilter = { status: 'active' };
  const activeIntentCount = await intents.countDocuments(activeIntentFilter);
  if (activeIntentCount > 0) {
    if (dryRun) {
      participantIntentsCancelled = activeIntentCount;
    } else {
      const result = await intents.updateMany(activeIntentFilter, {
        $set: { status: 'cancelled', updatedAt: now },
      });
      participantIntentsCancelled = result.modifiedCount;
    }
  }

  const requestCount = await intentRequests.countDocuments({});
  if (requestCount > 0) {
    if (dryRun) {
      participantIntentRequestsDeleted = requestCount;
    } else {
      const result = await intentRequests.deleteMany({});
      participantIntentRequestsDeleted = result.deletedCount;
    }
  }

  const seekingFilter = mongoOnlyRetiredSeekingActivityMode;
  const seekingCount = await activities.countDocuments(seekingFilter);
  if (seekingCount > 0) {
    if (dryRun) {
      seekingActivitiesRetired = seekingCount;
    } else {
      const result = await activities.updateMany(seekingFilter, {
        $set: { status: ActivityStatus.CANCELLED, updatedAt: now },
        $unset: { activityMode: '', participantIntentId: '' },
      });
      seekingActivitiesRetired = result.modifiedCount;
    }
  }

  const strayIntentFieldFilter = {
    participantIntentId: { $exists: true, $nin: [null, ''] },
  };
  const strayCount = await activities.countDocuments(strayIntentFieldFilter);
  if (strayCount > 0) {
    if (dryRun) {
      participantIntentFieldsUnset = strayCount;
    } else {
      const result = await activities.updateMany(strayIntentFieldFilter, {
        $unset: { participantIntentId: '' },
        $set: { updatedAt: now },
      });
      participantIntentFieldsUnset = result.modifiedCount;
    }
  }

  if (!dryRun && (participantIntentsCancelled > 0 || seekingActivitiesRetired > 0)) {
    scheduleExploreMapCacheInvalidation('retired-seeking-storage-purge');
  }

  return {
    participantIntentsCancelled,
    participantIntentRequestsDeleted,
    seekingActivitiesRetired,
    participantIntentFieldsUnset,
  };
};