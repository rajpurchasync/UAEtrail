import { NotificationType, ReviewTargetType } from '../domain/enums.js';
import { getMongoClient } from '../lib/mongo.js';
import { dispatchNotification } from './notifications.js';

/** Prompt checked-in participant to review the trip location (once). */
export async function promptPostActivityReview(opts: {
  userId: string;
  activityId: string;
  locationId: string;
  locationName: string;
  activityType: 'hiking' | 'camping' | 'community_activity';
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

  const reviewPath =
    opts.activityType === 'hiking'
      ? `/trail/${opts.locationId}`
      : opts.activityType === 'camping'
        ? `/camp/${opts.locationId}`
        : `/community-activity/${opts.locationId}`;

  await dispatchNotification({
    userId: opts.userId,
    title: 'How was your trip?',
    body: `Share your experience at ${opts.locationName} to help fellow hikers.`,
    type: NotificationType.REVIEW_PROMPT,
    meta: {
      activityId: opts.activityId,
      locationId: opts.locationId,
      reviewPath,
      activityType: opts.activityType
    }
  });
}
