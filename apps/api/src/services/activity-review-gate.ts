import {
  activityInstantHasEnded,
  inferPublishingProfileKindFromTenantWire,
  resolveActivityHostReviewTarget,
  resolveActivityHostUserId,
} from '@uaetrail/shared-types';
import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';
import { findActivityParticipantByEventAndUser } from '../lib/activity-engagement-store.js';
import { ApiError } from '../lib/api-error.js';
import type { ReviewTargetWire } from '../domain/review-target-wire.js';

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

/** Host review is the person or the operator on an outing the viewer finished. */
export const assertViewerCanReviewActivityHost = async (input: {
  userId: string;
  activityId: string;
  targetType: Extract<ReviewTargetWire, 'user' | 'tenant'>;
  targetId: string;
}): Promise<void> => {
  await assertViewerCanReviewActivity(input.userId, input.activityId);
  const activity = await findPublishedActivityWithPreviewsById(input.activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const hostUserId = resolveActivityHostUserId({
    hostId: activity.hostId,
    tenantOwnerId: activity.tenant.ownerId,
  });
  if (hostUserId && hostUserId === input.userId) {
    throw new ApiError(403, 'host_review_self', 'You cannot review yourself.');
  }

  const expected = resolveActivityHostReviewTarget({
    publishingProfileKind: inferPublishingProfileKindFromTenantWire({
      type: activity.tenant.type,
      businessMode: activity.tenant.businessMode,
      publishingPurpose: activity.tenant.publishingPurpose,
    }),
    hostId: activity.hostId,
    tenantOwnerId: activity.tenant.ownerId,
    tenantId: activity.tenantId,
  });
  if (
    !expected ||
    expected.targetType !== input.targetType ||
    expected.targetId !== input.targetId
  ) {
    throw new ApiError(400, 'host_review_target', 'Review the host of this outing.');
  }
};
