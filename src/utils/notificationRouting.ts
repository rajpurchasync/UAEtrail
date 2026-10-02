import {
  activityDetailPath,
  ADMIN_PLACES_PATH,
  EXPLORE_MAP_PATH,
  explorePath,
  isLegacyRewardsWalletPath,
  memberProfilePath,
  PROFILE_BADGES_PATH,
  PROFILE_PATH,
  PRO_MEMBERSHIP_PATH,
  tripsLegacyJoinedTabPath,
  tripsLegacyUpcomingSegmentPath,
} from '../config/routingCatalog';
import { NotificationDTO, placeDetailPath } from '@uaetrail/shared-types';

const toMetaObject = (meta: NotificationDTO['meta']): Record<string, unknown> | null =>
  meta && typeof meta === 'object' ? meta : null;

const toStringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

export const inferNotificationPath = (
  notif: NotificationDTO,
  options?: { preferAdminRoutes?: boolean }
): string => {
  const meta = toMetaObject(notif.meta);

  const directPath = toStringValue(meta?.path);
  if (directPath && directPath.startsWith('/')) {
    if (isLegacyRewardsWalletPath(directPath)) return PROFILE_BADGES_PATH;
    return directPath;
  }

  const reviewPath = toStringValue(meta?.reviewPath);
  if (reviewPath && reviewPath.startsWith('/')) {
    return `${reviewPath}#reviews`;
  }

  const requestId = toStringValue(meta?.requestId);
  if (requestId) {
    return `/my-requests/${requestId}`;
  }

  const activityId = toStringValue(meta?.activityId);
  if (activityId) {
    return activityDetailPath(activityId);
  }

  const senderId = toStringValue(meta?.senderId);
  if (senderId) {
    return `/messages?to=${encodeURIComponent(senderId)}`;
  }

  const kind = toStringValue(meta?.kind)?.toLowerCase() ?? '';
  if (kind === 'join_request_approved') {
    const groupId = toStringValue(meta?.groupId);
    if (groupId) return `/messages?group=${encodeURIComponent(groupId)}`;
    return tripsLegacyJoinedTabPath();
  }
  if (
    kind === 'join_request_pending' ||
    kind === 'join_request_waitlisted' ||
    kind === 'join_request_rejected' ||
    kind === 'join_request_withdrawn'
  ) {
    return tripsLegacyJoinedTabPath();
  }
  if (kind === 'group_message') {
    const groupId = toStringValue(meta?.groupId);
    if (groupId) return `/messages?group=${encodeURIComponent(groupId)}`;
  }
  if (kind === 'group_invite') {
    const inviteToken = toStringValue(meta?.inviteToken);
    if (inviteToken) return `/groups?invite=${encodeURIComponent(inviteToken)}`;
    const groupId = toStringValue(meta?.groupId);
    if (groupId) return `/messages?group=${encodeURIComponent(groupId)}`;
    return '/groups';
  }
  if (kind === 'group_invite_accepted') {
    const groupId = toStringValue(meta?.groupId);
    if (groupId) return `/messages?group=${encodeURIComponent(groupId)}`;
    return '/groups';
  }
  if (kind === 'request_withdrawal') {
    return '/host/requests';
  }
  if (kind === 'badge') {
    return PROFILE_BADGES_PATH;
  }
  if (kind === 'reward' || kind === 'tier_upgrade') {
    return PROFILE_BADGES_PATH;
  }
  if (kind === 'goal_halfway' || kind === 'goal_complete') {
    return tripsLegacyUpcomingSegmentPath();
  }
  if (kind === 'goal_behind_pace') {
    return tripsLegacyJoinedTabPath();
  }
  if (kind === 'connection_buddy_request' || kind === 'connection_buddy_accepted') {
    const buddyUserId = toStringValue(meta?.buddyUserId) ?? toStringValue(meta?.fromUserId);
    if (buddyUserId) return memberProfilePath(buddyUserId) ?? '/buddies';
    return '/buddies';
  }
  if (kind === 'connection_member_followed') {
    const followerUserId = toStringValue(meta?.followerUserId);
    if (followerUserId) return memberProfilePath(followerUserId) ?? PROFILE_PATH;
    return PROFILE_PATH;
  }
  if (kind === 'member_published' || kind === 'friend_published' || kind === 'friend_activity_published') {
    if (activityId) return activityDetailPath(activityId);
    const intentId = toStringValue(meta?.intentId);
    if (intentId) {
      return `${explorePath({ list: true, panel: 'activities' })}&pin=demand:${encodeURIComponent(intentId)}`;
    }
    const actorUserId = toStringValue(meta?.actorUserId) ?? toStringValue(meta?.hostUserId);
    if (actorUserId) {
      return memberProfilePath(actorUserId) ?? explorePath({ list: true }) ?? EXPLORE_MAP_PATH;
    }
    return explorePath({ list: true });
  }
  if (kind === 'buddy_request' && toStringValue(meta?.groupId)) {
    const inviteToken = toStringValue(meta?.inviteToken);
    if (inviteToken) return `/groups?invite=${encodeURIComponent(inviteToken)}`;
    return '/groups';
  }
  if (kind === 'location_approved') {
    const locationId = toStringValue(meta?.locationId);
    const activityType = toStringValue(meta?.activityType);
    if (locationId && activityType) {
      return placeDetailPath(activityType, locationId);
    }
    return explorePath({ panel: 'venues' });
  }
  if (kind === 'host_application_submitted' || kind === 'organizer_application_submitted') {
    return '/admin/hosts';
  }
  if (kind === 'host_application_approved' || kind === 'organizer_application_approved') {
    const shopPath = toStringValue(meta?.path);
    if (shopPath && shopPath.startsWith('/shop/')) return shopPath;
    return '/host/overview';
  }
  if (kind === 'host_application_rejected' || kind === 'organizer_application_rejected') {
    return PRO_MEMBERSHIP_PATH;
  }
  if (kind === 'host_suspended' || kind === 'host_reopened') {
    return kind === 'host_suspended' ? PRO_MEMBERSHIP_PATH : '/host/overview';
  }
  if (kind === 'user_suspended' || kind === 'user_reactivated') {
    return PROFILE_PATH;
  }
  if (kind === 'location_rejected') {
    return explorePath({ panel: 'venues', addLocation: true });
  }

  if (options?.preferAdminRoutes) {
    if (kind === 'location_submitted' && toStringValue(meta?.locationId)) {
      return ADMIN_PLACES_PATH;
    }
    if (kind === 'user_registered' && toStringValue(meta?.userId)) {
      return '/admin/users';
    }
    if (kind === 'activity_published' && toStringValue(meta?.activityId)) {
      return '/admin/activities';
    }
    if (
      kind === 'host_application_submitted' ||
      kind === 'organizer_application_submitted' ||
      toStringValue(meta?.applicationId)
    ) {
      return '/admin/hosts';
    }
    if (toStringValue(meta?.userId)) return '/admin/users';
    if (toStringValue(meta?.groupId)) return '/admin/groups';
    if (toStringValue(meta?.activityId)) return '/admin/activities';
    if (toStringValue(meta?.locationId)) return ADMIN_PLACES_PATH;
    if (toStringValue(meta?.productId)) return '/admin/shop';

    const adminText = `${notif.title} ${notif.body}`.toLowerCase();
    if (adminText.includes('application') || adminText.includes('host')) return '/admin/hosts';
    if (adminText.includes('user')) return '/admin/users';
    if (adminText.includes('group')) return '/admin/groups';
    if (adminText.includes('activity')) return '/admin/activities';
    if (adminText.includes('location')) return ADMIN_PLACES_PATH;
    if (adminText.includes('product') || adminText.includes('shop')) return '/admin/shop';
  }

  return PROFILE_PATH;
};
