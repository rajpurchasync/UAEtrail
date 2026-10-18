import { activityTypeToOutingCategory, type OutingCategory } from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { listWishlistWatchCandidates } from '../lib/wishlist-store.js';
import { wishlistWatchMatchesPin, type WishlistPinEvent } from '../lib/wishlist-match.js';
import { activityDetailPath, explorePublishedActivityPinPath } from '../lib/member-routes.js';
import { findSeekingActivityByParticipantIntentId } from './participant-intent-activity-readthrough.js';
import { logger } from '../lib/logger.js';

const resolveActivityPinCoords = (doc: {
  meetingLat: number | null;
  meetingLng: number | null;
  startLat: number | null;
  startLng: number | null;
}): { latitude: number | null; longitude: number | null } => {
  if (doc.meetingLat != null && doc.meetingLng != null) {
    return { latitude: doc.meetingLat, longitude: doc.meetingLng };
  }
  if (doc.startLat != null && doc.startLng != null) {
    return { latitude: doc.startLat, longitude: doc.startLng };
  }
  return { latitude: null, longitude: null };
};

const resolveActivityOutingCategory = (doc: {
  outingCategory?: string | null;
  activityType?: string | null;
}): OutingCategory | null => {
  if (doc.outingCategory) return doc.outingCategory as OutingCategory;
  const raw = doc.activityType?.toLowerCase();
  if (raw === 'hiking' || raw === 'camping' || raw === 'event' || raw === 'rideshare') {
    return activityTypeToOutingCategory(raw);
  }
  return null;
};

const fanOutWishlistNotifications = async (
  event: WishlistPinEvent,
  title: string,
  body: string,
  path: string,
  entityMeta: { activityId?: string; intentId?: string }
) => {
  const watches = await listWishlistWatchCandidates();
  const notified = new Set<string>();
  const rows: Array<{
    userId: string;
    title: string;
    body: string;
    type: typeof NotificationType.ACTIVITY;
    meta: unknown;
  }> = [];

  for (const watch of watches) {
    if (!wishlistWatchMatchesPin(watch, event)) continue;
    if (notified.has(watch.userId)) continue;
    notified.add(watch.userId);
    rows.push({
      userId: watch.userId,
      title,
      body,
      type: NotificationType.ACTIVITY,
      meta: {
        kind: 'wishlist_match',
        path,
        wishlistItemId: watch.wishlistItemId,
        ...(entityMeta.activityId ? { activityId: entityMeta.activityId } : {}),
        ...(entityMeta.intentId ? { intentId: entityMeta.intentId } : {}),
        ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
      },
    });
  }

  if (rows.length > 0) {
    await createNotificationsMany(rows);
  }
};

export const notifyWishlistForPublishedActivity = async (activityId: string): Promise<void> => {
  try {
    const doc = await findActivityDocInMongo(activityId);
    if (!doc) return;

    const { latitude, longitude } = resolveActivityPinCoords(doc);
    const outingCategory = resolveActivityOutingCategory(doc);
    const event: WishlistPinEvent = {
      composeIntent: 'organize',
      outingCategory,
      latitude,
      longitude,
      actorUserId: doc.createdById,
    };

    await fanOutWishlistNotifications(
      event,
      'New plan near your saved map',
      doc.title,
      activityDetailPath(activityId),
      { activityId }
    );
  } catch (error) {
    logger.warn({ err: error, activityId }, 'wishlist notify for activity failed');
  }
};

/** Notify wishlist *watchers* when a new public demand pin matches their saved intent — not a wishlist row for the demand itself. */
export const notifyWishlistForNewDemand = async (intentId: string, requesterUserId: string): Promise<void> => {
  try {
    const activity = await findSeekingActivityByParticipantIntentId(intentId);
    if (!activity) return;

    const { latitude, longitude } = resolveActivityPinCoords(activity);
    const event: WishlistPinEvent = {
      composeIntent: 'demand',
      outingCategory: resolveActivityOutingCategory(activity),
      latitude,
      longitude,
      actorUserId: requesterUserId,
    };

    await fanOutWishlistNotifications(
      event,
      'Someone is looking for a crew near you',
      activity.title,
      explorePublishedActivityPinPath({
        intentId,
        activityId: activity._id,
      }),
      { intentId, activityId: activity._id }
    );
  } catch (error) {
    logger.warn({ err: error, intentId }, 'wishlist notify for demand failed');
  }
};
