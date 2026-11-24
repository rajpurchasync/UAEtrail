import type { QueryKey } from '@tanstack/react-query';

/**
 * R8 client data layer (`src/hooks/`):
 * - `*ClientApi.ts` / `*Api.ts` — only modules that may call `api.*` (see `hooksApiFacadeGuard`).
 * - `use*.ts` — React hooks when cache/shared server state is worth it (keys defined here for R8.2).
 * - Pages/admin/member/console all import facades; same rules. See `docs/SYSTEM_COHERENCE.md` §8.6 migration MIG-CLIENT-QUERY.
 */
export { exploreMapQueryKey, exploreMapQueryKeyPrefix } from './exploreMapQuery';

/** Plan strip + coordination surfaces (`GET /me/coordination-attention`). */
export const coordinationAttentionQueryKey = ['coordination-attention'] as const;

/** Activity detail / join-context cache (R8.2). Viewer scope last so prefix invalidation still matches. */
export const activityDetailQueryKey = (
  activityId: string,
  viewerScope: string = 'guest'
): QueryKey => ['activity', activityId, viewerScope];

export const activityReviewsQueryKey = (activityId: string): QueryKey => [
  ...activityDetailQueryKey(activityId),
  'reviews',
];

export const entityFollowsQueryKey = ['me', 'entity-follows'] as const;

export const entityFollowStateQueryKey = (
  userId: string,
  target: { locationId?: string; tenantId?: string; merchantId?: string }
): QueryKey => [
  'entity-follow-state',
  userId,
  target.locationId ?? '',
  target.tenantId ?? '',
  target.merchantId ?? ''
];

/** Guest marketing landing upcoming activities (`GET /activities`). */
export const homeLandingActivitiesQueryKey = ['home', 'landing-activities'] as const;

export const meNotificationsPageQueryKey = (page: number): QueryKey => ['me', 'notifications', page];

export const wishlistTargetStateQueryKey = (
  userId: string,
  target: { locationId?: string; areaId?: string; activityId?: string }
): QueryKey => [
  'wishlist-target-state',
  userId,
  target.activityId ?? '',
  target.locationId ?? '',
  target.areaId ?? '',
];

export const shopPublicPageQueryKey = (id: string): QueryKey => ['shop-public-page', id];

/** Member earned + catalog badges (`GET /me/badges`). */
export const memberBadgesQueryKey = (userId: string): QueryKey => ['me', 'badges', userId];

/** Signed-in profile (`GET /me/profile`). */
export const meProfileQueryKey = (userId: string): QueryKey => ['me', 'profile', userId];

export const meProfileStatsQueryKey = (userId: string): QueryKey => ['me', 'profile-stats', userId];

export const meProfileViewStatsQueryKey = (userId: string): QueryKey => ['me', 'profile-view-stats', userId];

export const personPublicProfileQueryKey = (
  userId: string,
  variant:
    | 'me-preview'
    | {
        mode: 'person';
        discover: boolean;
        bundleKey?: string;
      }
): QueryKey => {
  if (variant === 'me-preview') {
    return ['person-public-profile', userId, 'me-preview'];
  }
  return [
    'person-public-profile',
    userId,
    'person',
    variant.discover ? 'discover' : 'direct',
    variant.bundleKey ?? 'base',
  ];
};

export const personSocialGraphFriendsQueryKey = (
  userId: string,
  viewerId: string | undefined
): QueryKey => ['person-social-graph', userId, viewerId ?? 'guest', 'friends'];

export const personSocialGraphCommonQueryKey = (
  userId: string,
  viewerId: string | undefined
): QueryKey => ['person-social-graph', userId, viewerId ?? 'guest', 'commonFollows'];

export const personUpcomingActivitiesQueryKey = (userId: string): QueryKey => [
  'person-upcoming-activities',
  userId,
];

export const personPastActivitiesQueryKey = (userId: string): QueryKey => [
  'person-past-activities',
  userId,
];

export const personSocialGraphQueryKey = (userId: string, viewerId: string | undefined): QueryKey => [
  'person-social-graph',
  userId,
  viewerId ?? 'guest',
];

export const friendRelationshipQueryKey = (viewerUserId: string, targetUserId: string): QueryKey => [
  'friend-relationship',
  viewerUserId,
  targetUserId,
];

export const meFriendsNetworkQueryKey = (userId: string): QueryKey => ['me', 'friends-network', userId];

export const meFriendActivityPresenceQueryKey = (userId: string): QueryKey => [
  'me',
  'friends-activity-presence',
  userId,
];

export const meFollowingMembersQueryKey = (userId: string): QueryKey => ['me', 'following-members', userId];

export const activityHostJoinRequestsQueryKey = (tenantId: string, activityId: string): QueryKey => [
  'activity-host-join-requests',
  tenantId,
  activityId,
];

export const memberJourneyMapQueryKeyPrefix = ['me', 'journey-map'] as const;

export const memberJourneyMapQueryKey = (userId: string): QueryKey => [
  ...memberJourneyMapQueryKeyPrefix,
  userId,
];

export const messagesInboxQueryKey = (userId: string): QueryKey => ['messages-inbox', userId];

export type MessagesInboxSlice = 'direct' | 'groups' | 'outings' | 'unread';

export const messagesInboxSliceQueryKey = (userId: string, slice: MessagesInboxSlice): QueryKey => [
  'messages-inbox',
  userId,
  slice,
];

export const placeDetailCoreQueryKey = (placeId: string, scope: string): QueryKey => [
  'place-detail-core',
  placeId,
  scope,
];

export const publicFacilityDetailQueryKey = (facilityId: string): QueryKey => [
  'facility-detail',
  facilityId,
];

/** Member capabilities (`GET /me/status`). */
export const memberStatusQueryKey = (userId: string): QueryKey => ['me', 'status', userId];

export const memberGoalsQueryKey = (userId: string): QueryKey => ['me', 'goals', userId];

export const memberAvailabilityQueryKey = (userId: string): QueryKey => ['me', 'availability', userId];

/** Plan saved / explore wishlist (`GET /me/wishlist`). */
export const meWishlistQueryKey = ['me', 'wishlist'] as const;

/** Member joined/hosted outings strip (`GET /me/activities`). */
export const myJoinedActivitiesQueryKey = ['me', 'activities'] as const;

/** Member activity join requests (`GET /me/requests`). */
export const myActivityJoinRequestsQueryKey = ['me', 'activity-requests'] as const;

export const activityInviteFriendsQueryKey = (activityId: string): QueryKey => [
  'me-friends',
  'invite',
  activityId,
];

export const activityJoinInvitesSentQueryKey = (activityId: string): QueryKey => [
  'activity-join-invites-sent',
  activityId,
];

export const meGroupsActivityInviteQueryKey = ['me-groups', 'activity-invite'] as const;

/** Family roster picker on activity detail (cached; only fetched when picker enabled). */
export const meFamilyPartyPickerGroupsQueryKey = ['me-groups', 'family-party-picker'] as const;
export const meFamilyPartyPickerMembersQueryKey = (groupId: string): QueryKey => [
  'me-groups',
  'family-party-picker',
  'members',
  groupId,
];

export const participantHubQueryKey = (userId: string): QueryKey => ['participant-hub', userId];

/** Published destinations (`GET /destinations` public list) — explore search + hub pickers. */
export const publishedAreasQueryKey = ['areas', 'published'] as const;

export const areaDetailQueryKey = (slug: string): QueryKey => ['area', slug];

export const areaAvailabilityQueryKey = (slug: string, weekFrom: string): QueryKey => [
  'area-availability',
  slug,
  weekFrom,
];

export const inboxUnreadQueryKey = (userId: string): QueryKey => ['inbox-unread', userId];

/** Cached open DM thread (messages + pagination cursor); viewer-scoped. */
export const directChatThreadQueryKey = (viewerId: string, partnerId: string): QueryKey => [
  'chat',
  'direct-thread',
  viewerId,
  partnerId,
];

/** Cached group wall for an open crew thread. */
export const groupChatWallQueryKey = (groupId: string): QueryKey => ['chat', 'group-wall', groupId];

export const notificationUnreadBadgeKey = (userId?: string | null): QueryKey => [
  'me-notification-unread-badge',
  userId,
];

export { meProfileSignupGateKey } from '../utils/signupProfileGate';
