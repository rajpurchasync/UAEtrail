import { NotificationType, ReviewTargetType } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { dispatchNotification } from './notifications.js';

/** Prompt checked-in participant to review the trip location (once). */
export async function promptPostEventReview(
  db: PrismaClient,
  opts: {
    userId: string;
    eventId: string;
    locationId: string;
    locationName: string;
    activityType: 'hiking' | 'camping';
  }
): Promise<void> {
  const existing = await db.review.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: opts.userId,
        targetType: ReviewTargetType.LOCATION,
        targetId: opts.locationId
      }
    }
  });
  if (existing) return;

  const reviewPath =
    opts.activityType === 'hiking' ? `/trail/${opts.locationId}` : `/camp/${opts.locationId}`;

  await dispatchNotification(db, {
    userId: opts.userId,
    title: 'How was your trip?',
    body: `Share your experience at ${opts.locationName} to help fellow hikers.`,
    type: NotificationType.REVIEW_PROMPT,
    meta: {
      eventId: opts.eventId,
      locationId: opts.locationId,
      reviewPath,
      activityType: opts.activityType
    }
  });
}
