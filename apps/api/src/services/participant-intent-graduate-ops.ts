/**
 * Ops / archive only — graduate legacy seeking joiners onto a hosted activity.
 * Product Find crew uses `PUT /me/availability`. HTTP graduate route retired (MIG-DISCO-REG).
 */
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';
import { ActivityStatus } from '../domain/enums.js';

export const linkParticipantIntentToActivityForOwner = async (
  intentId: string,
  ownerUserId: string,
  activityId: string
): Promise<ParticipantIntentDTO | null> => {
  const { findActivityDocInMongo } = await import('../lib/entity-sync.js');
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
  } = await import('./participant-intent-activity-readthrough.js');
  const seeking = await findSeekingActivityByParticipantIntentId(intentId);
  if (
    !seeking ||
    resolveSeekingActivityOwnerId(seeking) !== ownerUserId ||
    !isSeekingActivityEditable(seeking)
  ) {
    throw new ApiError(404, 'intent_not_found', 'Looking-for post not found or already closed.');
  }

  return linkParticipantIntentToActivity(intentId, activityId);
};

const linkParticipantIntentToActivity = async (
  intentId: string,
  activityId: string
): Promise<ParticipantIntentDTO | null> => {
  const {
    findSeekingActivityByParticipantIntentId,
    isSeekingActivityEditable,
    activityDocToParticipantIntentDto,
  } = await import('./participant-intent-activity-readthrough.js');
  const seeking = await findSeekingActivityByParticipantIntentId(intentId);
  if (!seeking || !isSeekingActivityEditable(seeking)) return null;

  const hostUserId = seeking.hostId ?? seeking.createdById;
  const { patchActivityInMongo } = await import('../lib/entity-sync.js');
  await patchActivityInMongo(seeking._id, {
    status: ActivityStatus.CANCELLED,
    seekingConvertedActivityId: activityId,
  });

  const { carryApprovedDemandJoinersToActivity } = await import('./participant-intent-carryover.js');
  await carryApprovedDemandJoinersToActivity({
    intentId,
    activityId,
    hostUserId,
  });

  scheduleExploreMapCacheInvalidation('participant-intent-graduate-ops.map_cache');
  const { findActivityDocInMongo } = await import('../lib/entity-sync.js');
  const refreshed = await findActivityDocInMongo(seeking._id);
  if (!refreshed) return null;
  const user = await findAuthUserById(hostUserId);
  return activityDocToParticipantIntentDto(refreshed, user);
};