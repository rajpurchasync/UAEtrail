import { exploreAvailabilityMapItemPath } from '@uaetrail/shared-types';

/** Deep links in API notification meta — keep in sync with `src/config/surfacePaths.ts`. */
export const PRO_MEMBERSHIP_PATH = '/profile/pro-membership';
export const PLAN_PATH = '/plan';
/** Community hosting hub — keep in sync with FE `HOSTING_HUB_PATH`. */
export const HOSTING_HUB_PATH = '/hosting';
export const PROFILE_PATH = '/profile';
export const PROFILE_BADGES_PATH = '/profile/badges';
export const GROUPS_PATH = '/groups';

export const MESSAGES_PATH = '/chat';
export const MY_REQUESTS_PATH = '/my-requests';
export const BUDDIES_PATH = '/buddies';
export const NOTIFICATIONS_PATH = '/settings/notifications';

export const buddiesIncomingRequestsPath = (): string => `${BUDDIES_PATH}?tab=requests`;

export const exploreActivityInvitePath = (activityId: string): string =>
  `/activity/${encodeURIComponent(activityId)}?join=1`;

/** Publishing console — canonical notification + email deep links. */
export const PUBLISHING_REQUESTS_PATH = '/publishing/requests';
export const PUBLISHING_ACTIVITIES_PATH = '/publishing/activities';
export const PUBLISHING_OVERVIEW_PATH = '/publishing/overview';

/** Admin console deep links (notification meta for platform admins). */
export const ADMIN_USERS_PATH = '/admin/users';
export const ADMIN_ACTIVITIES_PATH = '/admin/activities';
export const ADMIN_PLACES_PATH = '/admin/places';
export const ADMIN_FACILITIES_PATH = '/admin/facilities';
export const ADMIN_HOSTS_PATH = '/admin/hosts';

/** Explore list panels — keep in sync with `explorePath()` query contract. */
export const EXPLORE_VENUES_LIST_PATH = '/explore?panel=venues&list=1';

/** Plan schedule → joined outings — FE `tripsLegacyJoinedTabPath()`. */
export const planJoinedSchedulePath = (): string => `${PLAN_PATH}?view=plans&filter=joined`;

/** Community hosting hub (not My Plans) — FE `HOSTING_HUB_PATH` / `planHostingFilterPath()`. */
export const planHostedSchedulePath = (): string => HOSTING_HUB_PATH;

/** @deprecated Name kept for imports — value is canonical {@link PLAN_PATH}. */
export const TRIPS_JOINED_TAB_PATH = planJoinedSchedulePath();

/** @deprecated Legacy demand peek — use `myRequestDetailPath` or activity detail. */
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

/** Post-approve / joined — opens consumer welcome sheet on activity detail. */
export const activityDetailJoinedWelcomePath = (activityId: string): string =>
  `${activityDetailPath(activityId)}?joined=1`;

export const exploreActivityPinPath = (activityId: string): string =>
  `/explore?${new URLSearchParams({
    pin: `activity:${activityId}`,
    list: '1',
    panel: 'activities',
  }).toString()}`;

/** Notification deep link — fixed `member_availability` map pin. */
export const exploreAvailabilityPinNotificationPath = (availabilityMapItemId: string): string =>
  exploreAvailabilityMapItemPath(availabilityMapItemId);

/** Deep link for archived `activityMode: seeking` rows (off map — activity detail). */
export const explorePublishedActivityPinPath = (input: {
  intentId: string;
  activityId?: string | null;
}): string => {
  const activityId = input.activityId?.trim();
  if (activityId) return activityDetailPath(activityId);
  const params = new URLSearchParams({ list: '1' });
  return `/explore?${params.toString()}`;
};

/** @deprecated Use {@link explorePublishedActivityPinPath}. */
export const exploreSeekingPinPath = (input: {
  intentId: string;
  seekingActivityId?: string | null;
  activityId?: string | null;
}): string =>
  explorePublishedActivityPinPath({
    intentId: input.intentId,
    activityId: input.activityId ?? input.seekingActivityId ?? null,
  });
