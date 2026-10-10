import { exploreSeekingMapItemPath } from '@uaetrail/shared-types';

/** Deep links in API notification meta — keep in sync with `src/config/surfacePaths.ts`. */
export const PRO_MEMBERSHIP_PATH = '/profile/pro-membership';
export const PLAN_PATH = '/plan';
export const PROFILE_PATH = '/profile';
export const PROFILE_BADGES_PATH = '/profile/badges';
export const GROUPS_PATH = '/groups';

export const MESSAGES_PATH = '/chat';
export const HOST_MESSAGES_PATH = '/host/messages';
export const MY_REQUESTS_PATH = '/my-requests';
export const BUDDIES_PATH = '/buddies';
export const NOTIFICATIONS_PATH = '/notifications';

export const buddiesIncomingRequestsPath = (): string => `${BUDDIES_PATH}?tab=requests`;

export const exploreActivityInvitePath = (activityId: string): string =>
  `/activity/${encodeURIComponent(activityId)}?join=1`;

export const HOST_REQUESTS_PATH = '/host/requests';
export const HOST_ACTIVITIES_PATH = '/host/activities';
/** Tenant console only — do not use in consumer notification meta (use {@link PRO_MEMBERSHIP_PATH} or entity paths). */
export const HOST_OVERVIEW_PATH = '/host/overview';

/** Admin console deep links (notification meta for platform admins). */
export const ADMIN_USERS_PATH = '/admin/users';
export const ADMIN_ACTIVITIES_PATH = '/admin/activities';
export const ADMIN_PLACES_PATH = '/admin/places';
export const ADMIN_HOSTS_PATH = '/admin/hosts';

/** Explore list panels — keep in sync with `explorePath()` query contract. */
export const EXPLORE_VENUES_LIST_PATH = '/explore?panel=venues&list=1';

/** Plan schedule → joined outings — FE `tripsLegacyJoinedTabPath()`. */
export const planJoinedSchedulePath = (): string => `${PLAN_PATH}?view=plans&role=joined`;

/** Buddy host join queue on Plan (not tenant `/host/requests`) — FE `tripsPlansPath('hosted')`. */
export const planHostedSchedulePath = (): string => `${PLAN_PATH}?view=plans&role=hosted`;

/** @deprecated Name kept for imports — value is canonical {@link PLAN_PATH}. */
export const TRIPS_JOINED_TAB_PATH = planJoinedSchedulePath();

export const planSelfDemandPeekPath = (intentId: string): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  params.set('role', 'joined');
  params.set('peek', intentId);
  return `${PLAN_PATH}?${params.toString()}`;
};

export const messagesToUserPath = (userId: string): string =>
  `${MESSAGES_PATH}?to=${encodeURIComponent(userId)}`;

export const messagesGroupPath = (groupId: string, activityId?: string): string => {
  const params = new URLSearchParams({ group: groupId });
  if (activityId?.trim()) params.set('activity', activityId.trim());
  return `${MESSAGES_PATH}?${params.toString()}`;
};

export const myRequestDetailPath = (requestId: string): string =>
  `${MY_REQUESTS_PATH}/${encodeURIComponent(requestId)}`;

export const activityDetailPath = (activityId: string): string =>
  `/activity/${encodeURIComponent(activityId)}`;

export const exploreActivityPinPath = (activityId: string): string =>
  `/explore?${new URLSearchParams({
    pin: `activity:${activityId}`,
    list: '1',
    panel: 'activities',
  }).toString()}`;

/** Deep link when a find post has a published activity row (any `activityMode`). */
export const explorePublishedActivityPinPath = exploreSeekingMapItemPath;

/** @deprecated Use {@link explorePublishedActivityPinPath}. */
export const exploreSeekingPinPath = (input: {
  intentId: string;
  seekingActivityId?: string | null;
  activityId?: string | null;
}): string =>
  exploreSeekingMapItemPath({
    intentId: input.intentId,
    activityId: input.activityId ?? input.seekingActivityId ?? null,
  });
