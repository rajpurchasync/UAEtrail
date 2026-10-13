import type { NotificationDTO } from '@uaetrail/shared-types';
import { isMessagingNotification, notificationKind } from './notificationCategories';

/** Inbox topic buckets (product copy: Trips · Social · Account). */
export type NotificationTopic = 'all' | 'trips' | 'social' | 'account';

export const NOTIFICATION_TOPIC_OPTIONS: { id: NotificationTopic; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trips', label: 'Trips' },
  { id: 'social', label: 'Social' },
  { id: 'account', label: 'Account' },
];

export const inferNotificationTopic = (notif: NotificationDTO): Exclude<NotificationTopic, 'all'> => {
  const kind = notificationKind(notif);
  const text = `${notif.title} ${notif.body}`.toLowerCase();

  if (isMessagingNotification(notif)) return 'social';

  if (
    kind === 'connection_buddy_request' ||
    kind === 'connection_buddy_accepted' ||
    kind === 'connection_member_followed' ||
    kind === 'group_invite' ||
    kind === 'group_invite_accepted' ||
    kind.includes('comment_approved') ||
    kind.includes('comment_liked') ||
    text.includes('liked your comment') ||
    text.includes('started following you')
  ) {
    return 'social';
  }

  if (
    kind === 'badge' ||
    kind === 'reward' ||
    kind === 'tier_upgrade' ||
    kind.startsWith('host_application') ||
    kind.startsWith('organizer_application') ||
    kind === 'host_suspended' ||
    kind === 'host_reopened' ||
    kind === 'user_suspended' ||
    kind === 'user_reactivated' ||
    kind === 'location_submitted' ||
    kind === 'location_approved' ||
    kind === 'location_rejected' ||
    kind === 'user_registered' ||
    kind === 'activity_published'
  ) {
    return 'account';
  }

  if (
    kind === 'entity_activity_published' ||
    kind === 'wishlist_match' ||
    kind === 'activity_join_invite' ||
    kind.startsWith('join_request') ||
    kind === 'request_withdrawal' ||
    kind === 'activity_participant_revoked' ||
    kind.startsWith('demand_join') ||
    kind === 'member_published' ||
    kind === 'friend_published' ||
    kind === 'friend_activity_published' ||
    kind === 'schedule_change' ||
    kind.startsWith('goal_') ||
    notif.type === 'activity' ||
    notif.type === 'request_update' ||
    notif.type === 'review_prompt'
  ) {
    return 'trips';
  }

  if (kind.includes('reminder') || text.includes('reminder') || text.includes('request update')) {
    return 'trips';
  }

  if (text.includes('pro membership') || text.includes('host application') || text.includes('profile')) {
    return 'account';
  }

  return notif.type === 'system' ? 'account' : 'trips';
};

export const matchesNotificationTopic = (notif: NotificationDTO, topic: NotificationTopic): boolean =>
  topic === 'all' || inferNotificationTopic(notif) === topic;
