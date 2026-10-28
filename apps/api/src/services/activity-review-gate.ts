import { activityInstantHasEnded } from '@uaetrail/shared-types';
import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';
import { findActivityParticipantByEventAndUser } from '../lib/activity-engagement-store.js';
import { ApiError } from '../lib/api-error.js';

/** Activity reviews require a published outing, host check-in, and a finished schedule. */
export const assertViewerCanReviewActivity = async (
  userId: string,
  activityId: string
): Promise<void> => {
  const activity = await findPublishedActivityWithPreviewsById(activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  if (!activityInstantHasEnded(activity.startAt, activity.endAt, activity.location.countryCode)) {
    throw new ApiError(
      403,
      'activity_review_not_ended',
      'You can review this outing after it ends.'
    );
  }

  const participant = await findActivityParticipantByEventAndUser(activityId, userId);
  if (!participant?.checkedInAt) {
    throw new ApiError(
      403,
      'activity_review_not_eligible',
      'You can review this outing after the host checks you in.'
    );
  }
};
