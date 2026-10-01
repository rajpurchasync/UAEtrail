/**
 * Map publish fan-out: notify members who subscribed to a person (buddies + followers).
 *
 * Domain terms:
 * - **Member** — auth user (subscriptions are always userId → userId).
 * - **Buddy** — mutual connection; notified for hosted activities and demand posts.
 * - **Follow** — one-way subscription; notified **only when they host/publish an activity** (not demand/find posts).
 * - **Publish** — activity moved to published, or new participant demand on the map.
 *
 * Host `/operator/:slug` profiles represent a tenant; follow on that UI targets `tenant.ownerId`
 * until we add explicit tenant-level subscriptions.
 */
import { NotificationType } from '../domain/enums.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { listBuddiesForUser } from '../lib/buddy-store.js';
import { listFollowerIdsForUser } from '../lib/follow-store.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { logger } from '../lib/logger.js';

export type MemberPublishEvent =
  | { publishType: 'activity'; activityId: string; title: string }
  | { publishType: 'demand'; intentId: string; title: string };

const actorDisplayName = async (actorUserId: string): Promise<string> => {
  const actor = await findAuthUserById(actorUserId);
  return actor?.profile?.displayName ?? actor?.email?.split('@')[0] ?? 'Someone you follow';
};

const notificationCopy = (
  actorName: string,
  event: MemberPublishEvent
): { title: string; body: string; path: string } => {
  if (event.publishType === 'activity') {
    return {
      title: `${actorName} is hosting an outing`,
      body: event.title,
      path: `/activity/${event.activityId}`,
    };
  }
  return {
    title: `${actorName} posted on the map`,
    body: event.title,
    path: `/explore?pin=demand:${event.intentId}&list=1&panel=activities`,
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

    const actorName = await actorDisplayName(publisherUserId);
    const { title, body, path } = notificationCopy(actorName, event);

    const meta: Record<string, string> = {
      kind: 'member_published',
      publishType: event.publishType,
      actorUserId: publisherUserId,
      path,
    };
    if (event.publishType === 'activity') meta.activityId = event.activityId;
    else meta.intentId = event.intentId;

    await createNotificationsMany(
      recipientIds.map((userId) => ({
        userId,
        title,
        body,
        type: NotificationType.ACTIVITY,
        meta,
      }))
    );
  } catch (error) {
    logger.warn({ err: error, publisherUserId, event }, 'member publish notify failed');
  }
};
