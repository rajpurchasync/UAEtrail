/**
 * Map publish fan-out: notify members who subscribed to a person (buddies + followers).
 *
 * Domain terms:
 * - **Member** — auth user (subscriptions are always userId → userId).
 * - **Buddy** — mutual connection; notified for hosted activities and demand posts.
 * - **Follow** — one-way subscription; notified **only when they host/publish an activity** (not demand/find posts).
 * - **Publish** — activity moved to published, or new participant demand on the map.
 *
 * **Place / team / shop** subscriptions use `entity_follows` — see `entity-publish-notifications.ts`.
 */
import { NotificationType } from '../domain/enums.js';
import { listBuddiesForUser } from '../lib/buddy-store.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';
import { listFollowerIdsForUser } from '../lib/follow-store.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { activityDetailPath, exploreSeekingPinPath } from '../lib/member-routes.js';
import { logger } from '../lib/logger.js';

export type MemberPublishEvent =
  | { publishType: 'activity'; activityId: string; title: string }
  | { publishType: 'demand'; intentId: string; title: string; seekingActivityId?: string | null };

const notificationCopy = (
  actorName: string,
  event: MemberPublishEvent
): { title: string; body: string; path: string; kind: string } => {
  if (event.publishType === 'activity') {
    return {
      title: `${actorName} is hosting an outing`,
      body: event.title,
      path: activityDetailPath(event.activityId),
      kind: 'friend_activity_published',
    };
  }
  return {
    title: `${actorName} posted on the map`,
    body: event.title,
    path: exploreSeekingPinPath({
      intentId: event.intentId,
      seekingActivityId: event.seekingActivityId,
    }),
    kind: 'friend_published',
  };
};

const listPublishSubscriberIds = async (
  publisherUserId: string,
  event: MemberPublishEvent
): Promise<string[]> => {
  const buddies = await listBuddiesForUser(publisherUserId);
  const ids = new Set<string>();
  for (const buddy of buddies) ids.add(buddy.userId);
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

    const rows = await Promise.all(
      recipientIds.map(async (userId) => {
        const actorName = await resolveNotificationActorDisplayName(publisherUserId, userId);
        const { title, body, path, kind } = notificationCopy(actorName, event);
        const meta: Record<string, string> = {
          kind,
          actorUserId: publisherUserId,
          path,
        };
        if (event.publishType === 'activity') meta.activityId = event.activityId;
        else {
          meta.intentId = event.intentId;
          if (event.seekingActivityId) meta.seekingActivityId = event.seekingActivityId;
        }
        return {
          userId,
          title,
          body,
          type: NotificationType.ACTIVITY,
          meta,
        };
      })
    );

    await createNotificationsMany(rows);
  } catch (error) {
    logger.warn({ err: error, publisherUserId, event }, 'member publish notify failed');
  }
};
