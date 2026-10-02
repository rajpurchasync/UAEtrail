/** Deep links in API notification meta — keep in sync with `src/config/surfacePaths.ts`. */
export const PRO_MEMBERSHIP_PATH = '/profile/pro-membership';
export const PROFILE_PATH = '/profile';
export const PROFILE_BADGES_PATH = '/profile/badges';
export const GROUPS_PATH = '/groups';

export const MESSAGES_PATH = '/messages';
export const HOST_MESSAGES_PATH = '/host/messages';
export const MY_REQUESTS_PATH = '/my-requests';

export const HOST_REQUESTS_PATH = '/host/requests';
export const HOST_ACTIVITIES_PATH = '/host/activities';
export const HOST_OVERVIEW_PATH = '/host/overview';

/** Admin console deep links (notification meta for platform admins). */
export const ADMIN_USERS_PATH = '/admin/users';
export const ADMIN_ACTIVITIES_PATH = '/admin/activities';
export const ADMIN_PLACES_PATH = '/admin/places';
export const ADMIN_HOSTS_PATH = '/admin/hosts';

/** Explore list panels — keep in sync with `explorePath()` query contract. */
export const EXPLORE_VENUES_LIST_PATH = '/explore?panel=venues&list=1';

/** Legacy trips hub query — FE `tripsLegacyJoinedTabPath()`. */
export const TRIPS_JOINED_TAB_PATH = '/trips?segment=upcoming&tab=joined';

export const messagesToUserPath = (userId: string): string =>
  `${MESSAGES_PATH}?to=${encodeURIComponent(userId)}`;

export const messagesGroupPath = (groupId: string): string =>
  `${MESSAGES_PATH}?group=${encodeURIComponent(groupId)}`;

export const myRequestDetailPath = (requestId: string): string =>
  `${MY_REQUESTS_PATH}/${encodeURIComponent(requestId)}`;

export const activityDetailPath = (activityId: string): string =>
  `/activity/${encodeURIComponent(activityId)}`;

export const exploreDemandPinPath = (intentId: string): string =>
  `/explore?pin=demand:${encodeURIComponent(intentId)}&list=1&panel=activities`;
