import {
  activityDetailInvitePath,
  activityDetailPath,
  ADMIN_HOSTS_PATH,
  ADMIN_PLACES_PATH,
  ACTIVITIES_PATH,
  EXPLORE_MAP_PATH,
  explorePath,
  HOST_MESSAGES_PATH,
  isLegacyRewardsWalletPath,
  LEGACY_MESSAGES_PATH,
  memberProfilePath,
  BUDDIES_PATH,
  GROUPS_PATH,
  groupsPath,
  MESSAGES_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_PATH,
  PRO_MEMBERSHIP_PATH,
  rewriteLegacyPublishingConsolePath,
  TRIPS_PATH,
  messagesGroupPath,
  messagesToUserPath,
  myRequestDetailPath,
  planJoinedSchedulePath,
  planHostedSchedulePath,
} from '../config/routingCatalog';
import { planWishlistTabPath } from '../plan/planTab';
import {
  NotificationDTO,
  exploreSeekingMapItemPath,
  placeDetailPath,
} from '@uaetrail/shared-types';
import { resolveLegacyTripsHubRedirect } from '../member-plan/legacyTripsRedirect';

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

  if (
    pathname === LEGACY_MESSAGES_PATH ||
    pathname === HOST_MESSAGES_PATH ||
    pathname === '/operator/messages'
  ) {
    return `${MESSAGES_PATH}${search}`;
  }

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
  path = rewriteLegacyPublishingConsolePath(path);
  if (path === '/operator/overview' || path.startsWith('/operator/overview?')) {
    return PRO_MEMBERSHIP_PATH;
  }

  try {
    const legacyUrl = new URL(path, 'http://local');
    const legacyPathname = legacyUrl.pathname;
    if (
      (legacyPathname === TRIPS_PATH || legacyPathname === ACTIVITIES_PATH) &&
      legacyUrl.searchParams.get('tab') === 'joined' &&
      legacyUrl.searchParams.get('segment') === 'upcoming'
    ) {
      return planJoinedSchedulePath();
    }
  } catch {
    // ignore malformed paths
  }

  const queryIndex = path.indexOf('?');
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : path.slice(queryIndex);

  if (
    pathname === TRIPS_PATH ||
    pathname === ACTIVITIES_PATH ||
    pathname === '/trips/map'
  ) {
    const resolved = resolveLegacyTripsHubRedirect(pathname, search);
    if (resolved) return resolved;
  }

  const publishedActivityId =
    toStringValue(meta?.activityId) ?? toStringValue(meta?.seekingActivityId);
  if (publishedActivityId && path.includes('pin=demand:')) {
    return explorePath({
      list: true,
      panel: 'activities',
      pin: `activity:${publishedActivityId}`,
    });
  }

  return normalizeConsumerChatDeepLinkPath(path, meta);
};

export const inferNotificationPath = (
  notif: NotificationDTO,
  options?: { preferAdminRoutes?: boolean }
): string => {
  const meta = toMetaObject(notif.meta);

  const activityIdFromMeta = toStringValue(meta?.activityId);
  const directPath = toStringValue(meta?.path);
  if (directPath && directPath.startsWith('/')) {
    if (isLegacyRewardsWalletPath(directPath)) return PROFILE_BADGES_PATH;
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
    if (path) return path;
    if (activityId) {
      return `${activityDetailPath(activityId)}?joined=1`;
    }
    return planJoinedSchedulePath();
  }

  if (activityId) {
    return activityDetailPath(activityId);
  }
  if (kind === 'message') {
    const actor = toStringValue(meta?.actorUserId) ?? toStringValue(meta?.senderId);
    if (actor) return messagesToUserPath(actor);
  }
  const legacySenderId = toStringValue(meta?.senderId);
  if (legacySenderId) {
    return messagesToUserPath(legacySenderId);
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
  if (kind === 'connection_buddy_request' || kind === 'connection_buddy_accepted') {
    const actorUserId =
      toStringValue(meta?.actorUserId) ??
      toStringValue(meta?.fromUserId) ??
      toStringValue(meta?.buddyUserId);
    if (actorUserId) return memberProfilePath(actorUserId) ?? BUDDIES_PATH;
    return BUDDIES_PATH;
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
      const publishedActivityId =
        toStringValue(meta?.activityId) ?? toStringValue(meta?.seekingActivityId);
      return exploreSeekingMapItemPath({
        intentId,
        activityId: publishedActivityId,
      });
    }
    const actorUserId = toStringValue(meta?.actorUserId) ?? toStringValue(meta?.hostUserId);
    if (actorUserId) {
      return memberProfilePath(actorUserId) ?? explorePath({ list: true }) ?? EXPLORE_MAP_PATH;
    }
    return explorePath({ list: true });
  }
  if (kind === 'buddy_request' && toStringValue(meta?.groupId)) {
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
      return ADMIN_HOSTS_PATH;
    }
    if (toStringValue(meta?.userId)) return '/admin/users';
    if (toStringValue(meta?.groupId)) return '/admin/groups';
    if (toStringValue(meta?.activityId)) return '/admin/activities';
    if (toStringValue(meta?.locationId)) return ADMIN_PLACES_PATH;
    if (toStringValue(meta?.productId)) return '/admin/shop';

    const adminText = `${notif.title} ${notif.body}`.toLowerCase();
    if (adminText.includes('application') || adminText.includes('host')) return ADMIN_HOSTS_PATH;
    if (adminText.includes('user')) return '/admin/users';
    if (adminText.includes('group')) return '/admin/groups';
    if (adminText.includes('activity')) return '/admin/activities';
    if (adminText.includes('location')) return ADMIN_PLACES_PATH;
    if (adminText.includes('product') || adminText.includes('shop')) return '/admin/shop';
  }

  return PROFILE_PATH;
};
