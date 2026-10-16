import { canonicalPlaceDetailPath } from '@uaetrail/shared-types';
import { NotificationType, ReviewTargetType } from '../domain/enums.js';
import { getMongoClient } from '../lib/mongo.js';
import { dispatchNotification } from './notifications.js';

/** Prompt checked-in participant to review the activity location (once). */
export async function promptPostActivityReview(opts: {
  userId: string;
  activityId: string;
  locationId: string;
  locationName: string;
  activityType: 'hiking' | 'camping' | 'event';
}): Promise<void> {
  const mongo = getMongoClient();
  if (mongo) {
    const existing = await mongo.db().collection('social_reviews').findOne({
      userId: opts.userId,
      targetType: ReviewTargetType.LOCATION,
      targetId: opts.locationId
    });
    if (existing) return;
  }

  const reviewPath = canonicalPlaceDetailPath(opts.locationId);

  await dispatchNotification({
    userId: opts.userId,
    title: 'How was your activity?',
    body: `Share your experience at ${opts.locationName} to help fellow hikers.`,
    type: NotificationType.REVIEW_PROMPT,
    meta: {
      kind: 'review_prompt',
      activityId: opts.activityId,
      locationId: opts.locationId,
      path: reviewPath,
      reviewPath,
      activityType: opts.activityType,
    },
  });
}
