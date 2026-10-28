import { activityTypeToOutingCategory, type OutingCategory } from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import { findActivityDocInMongo, findLocationInMongo } from '../lib/entity-sync.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { listWishlistSaversForLocation, listWishlistWatchCandidates } from '../lib/wishlist-store.js';
import { wishlistWatchMatchesPin, type WishlistPinEvent } from '../lib/wishlist-match.js';
import { activityDetailPath, explorePublishedActivityPinPath } from '../lib/member-routes.js';
import { findSeekingActivityByParticipantIntentId } from './participant-intent-activity-readthrough.js';
import { resolveNotificationActorDisplayNamesForRecipients } from './notification-actor-label.js';
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

type WishlistNotifyRow = {
  userId: string;
  title: string;
  body: string;
  type: typeof NotificationType.ACTIVITY;
  meta: Record<string, unknown>;
};

const fanOutWishlistNotifications = async (
  event: WishlistPinEvent,
  title: string,
  body: string,
  path: string,
  entityMeta: { activityId?: string; intentId?: string },
  notified: Set<string>
): Promise<void> => {
  const watches = await listWishlistWatchCandidates();
  const rows: WishlistNotifyRow[] = [];

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

/** Saved catalog place (`locationId` on wishlist) — same trip-alert intent as map “Save place”. */
const fanOutSavedPlaceWishlistNotifications = async (
  input: {
    activityId: string;
    title: string;
    hostUserId: string;
    locationId: string;
  },
  notified: Set<string>
): Promise<void> => {
  const savers = await listWishlistSaversForLocation(input.locationId);
  if (savers.length === 0) return;

  const location = await findLocationInMongo(input.locationId);
  if (!location) return;
  const placeName = location.name;
  const path = activityDetailPath(input.activityId);
  const recipientIds = savers.map((row) => row.userId).filter((userId) => userId !== input.hostUserId);
  if (recipientIds.length === 0) return;

  const actorNames = await resolveNotificationActorDisplayNamesForRecipients(
    input.hostUserId,
    recipientIds
  );

  const rows: WishlistNotifyRow[] = [];
  for (const saver of savers) {
    if (saver.userId === input.hostUserId) continue;
    if (notified.has(saver.userId)) continue;
    notified.add(saver.userId);
    const actorName = actorNames.get(saver.userId);
    if (!actorName) continue;
    rows.push({
      userId: saver.userId,
      title: `New outing at ${placeName}`,
      body: `${actorName}: ${input.title}`,
      type: NotificationType.ACTIVITY,
      meta: {
        kind: 'wishlist_match',
        path,
        activityId: input.activityId,
        locationId: input.locationId,
        wishlistItemId: saver.wishlistItemId,
        actorUserId: input.hostUserId,
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

    const notified = new Set<string>();
    const path = activityDetailPath(activityId);

    if (doc.locationId) {
      await fanOutSavedPlaceWishlistNotifications(
        {
          activityId,
          title: doc.title,
          hostUserId: doc.createdById,
          locationId: doc.locationId,
        },
        notified
      );
    }

    const { latitude, longitude } = resolveActivityPinCoords(doc);
    const outingCategory = resolveActivityOutingCategory(doc);
    const event: WishlistPinEvent = {
      composeIntent: 'host',
      outingCategory,
      latitude,
      longitude,
      actorUserId: doc.createdById,
    };

    await fanOutWishlistNotifications(
      event,
      'New plan near your saved map',
      doc.title,
      path,
      { activityId },
      notified
    );
  } catch (error) {
    logger.warn({ err: error, activityId }, 'wishlist notify for activity failed');
  }
};

/** Notify wishlist watchers when a new public seeking pin matches their saved intent. */
export const notifyWishlistForNewSeeking = async (intentId: string, requesterUserId: string): Promise<void> => {
  try {
    const activity = await findSeekingActivityByParticipantIntentId(intentId);
    if (!activity) return;

    const { latitude, longitude } = resolveActivityPinCoords(activity);
    const event: WishlistPinEvent = {
      composeIntent: 'seek',
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
      { intentId, activityId: activity._id },
      new Set<string>()
    );
  } catch (error) {
    logger.warn({ err: error, intentId }, 'wishlist notify for seeking failed');
  }
};
