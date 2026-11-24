import {
  activityDetailInvitePath,
  activityDetailPath,
  ADMIN_HOSTS_PATH,
  ADMIN_PLACES_PATH,
  explorePath,
  memberProfileLink,
  GROUPS_PATH,
  communityClubPath,
  groupsPath,
  MESSAGES_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_PATH,
  PRO_MEMBERSHIP_PATH,
  messagesGroupPath,
  messagesToUserPath,
  myRequestDetailPath,
  planJoinedSchedulePath,
  planHostedSchedulePath,
} from '../config/routingCatalog';
import { MY_CREWS_PATH } from '../config/surfacePaths';
import { planWishlistTabPath } from '../plan/planTab';
import {
  NotificationDTO,
  canonicalizeInboundProductPath,
  exploreAvailabilityMapItemPath,
  placeDetailPath,
  resolveNotificationActorUserId,
} from '@uaetrail/shared-types';

const toMetaObject = (meta: NotificationDTO['meta']): Record<string, unknown> | null =>
  meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : null;

const toStringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const normalizeConsumerChatDeepLinkPath = (
  path: string,
  meta: Record<string, unknown> | null
): string => {
  const queryIndex = path.indexOf('?');
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : path.slice(queryIndex);

  if (pathname === GROUPS_PATH && search) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const groupId = params.get('group');
    const tab = params.get('tab');
    const invite = params.get('invite');
    const create = params.get('create');
    const kind = toStringValue(meta?.kind)?.toLowerCase() ?? '';
    if (
      groupId &&
      !tab &&
      !invite &&
      !create &&
      (kind === 'group_message' || kind === 'group_invite_accepted')
    ) {
      const activityId = toStringValue(meta?.activityId);
      return messagesGroupPath(groupId, activityId ?? undefined);
    }
  }

  return path;
};

const normalizeDirectNotificationPath = (
  path: string,
  meta: Record<string, unknown> | null
): string => {
  const canonical = canonicalizeInboundProductPath(path);
  if (canonical !== path) return canonical;
  return normalizeConsumerChatDeepLinkPath(canonical, meta);
};

export const inferNotificationPath = (
  notif: NotificationDTO,
  options?: { preferAdminRoutes?: boolean }
): string => {
  const meta = toMetaObject(notif.meta);

  const activityIdFromMeta = toStringValue(meta?.activityId);
  const directPath = toStringValue(meta?.path);
  if (directPath && directPath.startsWith('/')) {
    const kindEarly = toStringValue(meta?.kind)?.toLowerCase() ?? '';
    if (
      kindEarly === 'activity_join_invite' &&
      activityIdFromMeta &&
      directPath.startsWith('/explore')
    ) {
      return activityDetailInvitePath(activityIdFromMeta);
    }
    if (
      activityIdFromMeta &&
      directPath.includes('invite=1') &&
      directPath.startsWith('/explore')
    ) {
      return activityDetailInvitePath(activityIdFromMeta);
    }
    return normalizeDirectNotificationPath(directPath, meta);
  }

  const reviewPath = toStringValue(meta?.reviewPath);
  if (reviewPath && reviewPath.startsWith('/')) {
    return `${reviewPath}#reviews`;
  }

  const requestId = toStringValue(meta?.requestId);
  if (requestId) {
    return myRequestDetailPath(requestId);
  }

  const kind = toStringValue(meta?.kind)?.toLowerCase() ?? '';
  const activityId = toStringValue(meta?.activityId);
  if (kind === 'activity_join_invite' && activityId) {
    return activityDetailInvitePath(activityId);
  }

  if (kind === 'join_request_approved') {
    const path = toStringValue(meta?.path);
    if (path) return canonicalizeInboundProductPath(path);
    if (activityId) {
      return `${activityDetailPath(activityId)}?joined=1`;
    }
    return planJoinedSchedulePath();
  }

  if (activityId) {
    return activityDetailPath(activityId);
  }
  if (kind === 'message') {
    const actor = meta ? resolveNotificationActorUserId(meta) : null;
    if (actor) return messagesToUserPath(actor);
  }
  if (
    kind === 'join_request_pending' ||
    kind === 'join_request_waitlisted' ||
    kind === 'join_request_rejected' ||
    kind === 'join_request_withdrawn'
  ) {
    return planJoinedSchedulePath();
  }
  if (kind === 'group_message') {
    const groupId = toStringValue(meta?.groupId);
    if (groupId) return messagesGroupPath(groupId);
  }
  if (kind === 'group_invite') {
    const inviteToken = toStringValue(meta?.inviteToken);
    if (inviteToken) return groupsPath({ invite: inviteToken });
    const groupId = toStringValue(meta?.groupId);
    if (groupId) return messagesGroupPath(groupId);
    return GROUPS_PATH;
  }
  if (kind === 'group_invite_accepted') {
    const groupId = toStringValue(meta?.groupId);
    if (groupId) return messagesGroupPath(groupId);
    return GROUPS_PATH;
  }
  if (kind === 'request_withdrawal') {
    return planHostedSchedulePath();
  }
  if (kind === 'badge') {
    return PROFILE_BADGES_PATH;
  }
  if (kind === 'reward' || kind === 'tier_upgrade') {
    return PROFILE_BADGES_PATH;
  }
  if (kind === 'goal_halfway' || kind === 'goal_complete' || kind === 'goal_behind_pace') {
    return planWishlistTabPath();
  }
  if (kind === 'connection_friend_request' || kind === 'connection_friend_accepted') {
    const actorUserId = meta ? resolveNotificationActorUserId(meta) : null;
    if (actorUserId) return memberProfileLink(actorUserId);
    return MY_CREWS_PATH;
  }
  if (kind === 'connection_member_followed') {
    const followerUserId = toStringValue(meta?.followerUserId);
    if (followerUserId) return memberProfileLink(followerUserId);
    return PROFILE_PATH;
  }
  if (kind === 'wishlist_match' && activityId) {
    return activityDetailPath(activityId);
  }
  if (kind === 'entity_activity_published' && activityId) {
    return activityDetailPath(activityId);
  }
  if (kind === 'member_published' || kind === 'member_activity_published') {
    if (activityId) return activityDetailPath(activityId);
    const availabilityPin =
      toStringValue(meta?.availabilityMapItemId) ?? toStringValue(meta?.exploreItemId);
    if (availabilityPin?.startsWith('availability:')) {
      return exploreAvailabilityMapItemPath(availabilityPin);
    }
    const publishedActivityId =
      toStringValue(meta?.activityId) ?? toStringValue(meta?.seekingActivityId);
    if (publishedActivityId) {
      return activityDetailPath(publishedActivityId);
    }
    const actorUserId = toStringValue(meta?.actorUserId) ?? toStringValue(meta?.hostUserId);
    if (actorUserId) {
      return memberProfileLink(actorUserId);
    }
    return explorePath({ list: true });
  }
  if (
    kind === 'community_join_request' ||
    kind === 'community_member_joined'
  ) {
    const slug = toStringValue(meta?.slug);
    if (slug) return `${communityClubPath(slug)}#community-members`;
  }
  if (kind === 'community_join_approved') {
    const slug = toStringValue(meta?.slug);
    if (slug) return communityClubPath(slug);
  }
  if (kind === 'friend_request' && toStringValue(meta?.groupId)) {
    const inviteToken = toStringValue(meta?.inviteToken);
    if (inviteToken) return groupsPath({ invite: inviteToken });
    return GROUPS_PATH;
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
    return ADMIN_HOSTS_PATH;
  }
  if (kind === 'host_application_approved' || kind === 'organizer_application_approved') {
    const shopPath = toStringValue(meta?.path);
    if (shopPath && shopPath.startsWith('/shop/')) return shopPath;
    return PRO_MEMBERSHIP_PATH;
  }
  if (kind === 'host_application_rejected' || kind === 'organizer_application_rejected') {
    return PRO_MEMBERSHIP_PATH;
  }
  if (kind === 'host_suspended' || kind === 'host_reopened') {
    return PRO_MEMBERSHIP_PATH;
  }
  if (kind === 'user_suspended' || kind === 'user_reactivated') {
    return PROFILE_PATH;
  }
  if (kind === 'location_rejected') {
    return explorePath({ panel: 'venues', compose: { surface: 'menu', composeKind: 'place' } });
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
      return ADMIN_HOSTS_PATH;
    }
    if (toStringValue(meta?.userId)) return '/admin/users';
    if (toStringValue(meta?.groupId)) return '/admin/groups';
    if (toStringValue(meta?.activityId)) return '/admin/activities';
    if (toStringValue(meta?.locationId)) return ADMIN_PLACES_PATH;

    const adminText = `${notif.title} ${notif.body}`.toLowerCase();
    if (adminText.includes('application') || adminText.includes('host')) return ADMIN_HOSTS_PATH;
    if (adminText.includes('user')) return '/admin/users';
    if (adminText.includes('group')) return '/admin/groups';
    if (adminText.includes('activity')) return '/admin/activities';
    if (adminText.includes('location')) return ADMIN_PLACES_PATH;
    if (adminText.includes('shop')) return ADMIN_HOSTS_PATH;
  }

  return PROFILE_PATH;
};