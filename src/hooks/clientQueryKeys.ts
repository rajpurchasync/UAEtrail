import type { QueryKey } from '@tanstack/react-query';

/**
 * R8 client data layer (`src/hooks/`):
 * - `*ClientApi.ts` / `*Api.ts` — only modules that may call `api.*` (see `hooksApiFacadeGuard`).
 * - `use*.ts` — React hooks when cache/shared server state is worth it (keys defined here for R8.2).
 * - Pages/admin/member/console all import facades; same rules. See `docs/experiment/system-refactor-plan.md` § R8.1.
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

/** Member demand / self plans (`GET /me/participant-intents`). */
export const myParticipantIntentsQueryKey = (refreshKey?: number): QueryKey =>
  refreshKey != null && refreshKey !== 0
    ? ['my-participant-intents', refreshKey]
    : ['my-participant-intents'];

export const entityFollowsQueryKey = ['me', 'entity-follows'] as const;

/** Plan saved / explore wishlist (`GET /me/wishlist`). */
export const meWishlistQueryKey = ['me', 'wishlist'] as const;

/** Member joined/hosted outings strip (`GET /me/activities`). */
export const myJoinedActivitiesQueryKey = ['me', 'activities'] as const;

/** Member activity join requests (`GET /me/requests`). */
export const myActivityJoinRequestsQueryKey = ['me', 'activity-requests'] as const;

export const activityInviteBuddiesQueryKey = (activityId: string): QueryKey => [
  'me-buddies',
  'invite',
  activityId,
];

export const activityJoinInvitesSentQueryKey = (activityId: string): QueryKey => [
  'activity-join-invites-sent',
  activityId,
];

export const meGroupsActivityInviteQueryKey = ['me-groups', 'activity-invite'] as const;

export const participantHubQueryKey = (userId: string): QueryKey => ['participant-hub', userId];

export const areaDetailQueryKey = (slug: string): QueryKey => ['area', slug];

export const areaAvailabilityQueryKey = (slug: string, weekFrom: string): QueryKey => [
  'area-availability',
  slug,
  weekFrom,
];

export const inboxUnreadQueryKey = (userId: string): QueryKey => ['inbox-unread', userId];

export const notificationUnreadBadgeKey = (userId?: string | null): QueryKey => [
  'me-notification-unread-badge',
  userId,
];

export { meProfileSignupGateKey } from '../utils/signupProfileGate';
