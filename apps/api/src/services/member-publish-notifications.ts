/**
 * Map publish fan-out: notify members who subscribed to a person (friends + followers).
 *
 * Domain terms:
 * - **Member** — auth user (subscriptions are always userId → userId).
 * - **Friend** — mutual connection; notified for hosted activities and map availability.
 * - **Follow** — one-way subscription; notified **only when they host/publish an activity** (not map availability).
 * - **Publish** — activity moved to published, or fixed availability on the map (`member_availability`).
 *
 * **Place / team / shop** subscriptions use `entity_follows` — see `entity-publish-notifications.ts`.
 */
import { NotificationType } from '../domain/enums.js';
import { listFriendsForUser } from '../lib/friend-store.js';
import { resolveNotificationActorDisplayNamesForRecipients } from './notification-actor-label.js';
import { listFollowerIdsForUser } from '../lib/follow-store.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import {
  activityDetailPath,
  exploreAvailabilityPinNotificationPath,
} from '../lib/member-routes.js';
import { logger } from '../lib/logger.js';

export type MemberPublishEvent =
  | { publishType: 'activity'; activityId: string; title: string }
  | { publishType: 'availability'; availabilityMapItemId: string; title: string };

const notificationCopy = (
  actorName: string,
  event: MemberPublishEvent
): { title: string; body: string; path: string; kind: string } => {
  if (event.publishType === 'activity') {
    return {
      title: `${actorName} is hosting an outing`,
      body: event.title,
      path: activityDetailPath(event.activityId),
      kind: 'member_activity_published',
    };
  }
  return {
    title: `${actorName} posted on the map`,
    body: event.title,
    path: exploreAvailabilityPinNotificationPath(event.availabilityMapItemId),
    kind: 'member_published',
  };
};

const listPublishSubscriberIds = async (
  publisherUserId: string,
  event: MemberPublishEvent
): Promise<string[]> => {
  const friends = await listFriendsForUser(publisherUserId);
  const ids = new Set<string>();
  for (const friend of friends) ids.add(friend.userId);
  if (event.publishType === 'activity') {
    const followerIds = await listFollowerIdsForUser(publisherUserId);
    for (const followerId of followerIds) ids.add(followerId);
  }
  return [...ids];
};

/** Notify buddies (and followers on hosted activities) when a member publishes map-visible content. */
export const notifyMemberPublishSubscribers = async (
  publisherUserId: string,
  event: MemberPublishEvent
): Promise<void> => {
  try {
    const recipientIds = await listPublishSubscriberIds(publisherUserId, event);
    if (recipientIds.length === 0) return;

    const actorNames = await resolveNotificationActorDisplayNamesForRecipients(
      publisherUserId,
      recipientIds
    );
    const rows = recipientIds.map((userId) => {
      const actorName = actorNames.get(userId) ?? 'Someone on UAE Trail';
      const { title, body, path, kind } = notificationCopy(actorName, event);
      const meta: Record<string, string> = {
        kind,
        actorUserId: publisherUserId,
        path,
      };
      if (event.publishType === 'activity') meta.activityId = event.activityId;
      else {
        meta.availabilityMapItemId = event.availabilityMapItemId;
        meta.exploreItemId = event.availabilityMapItemId;
      }
      return {
        userId,
        title,
        body,
        type: NotificationType.ACTIVITY,
        meta,
      };
    });

    await createNotificationsMany(rows);
  } catch (error) {
    logger.warn({ err: error, publisherUserId, event }, 'member publish notify failed');
  }
};