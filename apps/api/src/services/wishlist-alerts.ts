import {
  activityTypeToOutingCategory,
  participantIntentKindToOutingCategory,
  type OutingCategory,
} from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { listWishlistWatchCandidates } from '../lib/favorites-store.js';
import { getMongoClient } from '../lib/mongo.js';
import { COLLECTIONS } from '../lib/collections.js';
import { wishlistWatchMatchesPin, type WishlistPinEvent } from '../lib/wishlist-match.js';
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
  if (raw === 'hiking' || raw === 'camping' || raw === 'event' || raw === 'carpool') {
    return activityTypeToOutingCategory(raw);
  }
  return null;
};

const fanOutWishlistNotifications = async (event: WishlistPinEvent, title: string, body: string, path: string) => {
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
      meta: { kind: 'wishlist_match', path, favoriteId: watch.favoriteId },
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
      `/activity/${activityId}`
    );
  } catch (error) {
    logger.warn({ err: error, activityId }, 'wishlist notify for activity failed');
  }
};

export const notifyWishlistForNewDemand = async (intentId: string, requesterUserId: string): Promise<void> => {
  try {
    const doc = await getMongoClient()!
      .db()
      .collection<{
        _id: string;
        kind: string;
        title: string;
        latitude: number | null;
        longitude: number | null;
      }>(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: intentId });

    if (!doc) return;

    const kind = doc.kind as 'hiking' | 'camping' | 'event' | 'guide' | 'carpool' | 'other';
    const event: WishlistPinEvent = {
      composeIntent: 'demand',
      outingCategory: participantIntentKindToOutingCategory(kind),
      latitude: doc.latitude,
      longitude: doc.longitude,
      actorUserId: requesterUserId,
    };

    await fanOutWishlistNotifications(
      event,
      'Someone is looking for a crew near you',
      doc.title,
      `/explore?pin=demand:${intentId}&list=1&panel=activities`
    );
  } catch (error) {
    logger.warn({ err: error, intentId }, 'wishlist notify for demand failed');
  }
};
