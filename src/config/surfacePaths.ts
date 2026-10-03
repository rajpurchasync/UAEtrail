/**
 * Consumer surface paths (secondary hubs, profile, legacy aliases).
 * No imports — safe for platform.ts and routingCatalog.
 *
 * @see docs/NAVIGATION.md · docs/DOMAIN_CANONICALS.md
 */

/** Personal hub */
export const PROFILE_PATH = '/profile' as const;

/** Trips hub — upcoming, past, wishlist (`docs/NAVIGATION.md`) */
export const TRIPS_PATH = '/trips' as const;

/** Admin / host place registry consoles */
export const ADMIN_PLACES_PATH = '/admin/places' as const;
export const HOST_PLACES_PATH = '/host/places' as const;
export const PROFILE_EDIT_PATH = '/profile/edit' as const;
export const PROFILE_REVIEWS_PATH = '/profile/reviews' as const;
export const PROFILE_SETTINGS_PATH = '/profile/settings' as const;
export const PROFILE_SETTINGS_ACCOUNT_PATH = '/profile/settings/account' as const;
export const PROFILE_SETTINGS_PRIVACY_PATH = '/profile/settings/privacy' as const;
export const PROFILE_SETTINGS_NOTIFICATIONS_PATH = '/profile/settings/notifications' as const;

/** Member achievement badges (no Trail Points wallet) */
export const PROFILE_BADGES_PATH = '/profile/badges' as const;

/** Legacy community feed — redirects to explore (`App.tsx`). */
export const COMMUNITY_PATH = '/community' as const;

/** Legacy membership marketing — redirects to explore (`Membership.tsx`) */
export const MEMBERSHIP_MARKETING_PATH = '/membership' as const;

/** Social subgraph */
export const GROUPS_PATH = '/groups' as const;
export const BUDDIES_PATH = '/buddies' as const;
export const CONTRIBUTIONS_PATH = '/contributions' as const;

export const groupsPath = (options?: {
  create?: boolean;
  from?: string;
  invite?: string;
}): string => {
  const params = new URLSearchParams();
  if (options?.create) params.set('create', '1');
  if (options?.from) params.set('from', options.from);
  if (options?.invite) params.set('invite', options.invite);
  const qs = params.toString();
  return qs ? `${GROUPS_PATH}?${qs}` : GROUPS_PATH;
};

/** In-app notification inbox */
export const NOTIFICATIONS_PATH = '/notifications' as const;

/** Consumer inbox + threads — keep string literal in sync with `apps/api/src/lib/member-routes.ts`. */
export const MESSAGES_PATH = '/chat' as const;
/** Communication hub — UI label: Chat (same route as {@link MESSAGES_PATH}). */
export const CHAT_PATH = MESSAGES_PATH;
/** Legacy inbox URL — redirects to {@link CHAT_PATH} in `App.tsx`. */
export const LEGACY_MESSAGES_PATH = '/messages' as const;
export const HOST_MESSAGES_PATH = '/host/messages' as const;
export const MY_REQUESTS_PATH = '/my-requests' as const;

/** Host console — keep in sync with `apps/api/src/lib/member-routes.ts` */
export const HOST_OVERVIEW_PATH = '/host/overview' as const;
export const HOST_ACTIVITIES_PATH = '/host/activities' as const;
export const HOST_ACTIVITIES_NEW_PATH = '/host/activities/new' as const;
export const HOST_REQUESTS_PATH = '/host/requests' as const;
export const HOST_TEAM_PATH = '/host/team' as const;
export const HOST_PROFILE_PATH = '/host/profile' as const;
export const HOST_HISTORY_PATH = '/host/history' as const;

/** Auth funnel */
export const SIGNIN_PATH = '/signin' as const;
export const SIGNUP_PATH = '/signup' as const;
export const WELCOME_PATH = '/welcome' as const;
export const VERIFY_PATH = '/verify' as const;
export const FORGOT_PASSWORD_PATH = '/forgot-password' as const;

export const signInPath = (options?: {
  redirect?: string;
  focus?: string;
  scrollY?: number;
}): string => {
  const params = new URLSearchParams();
  if (options?.redirect?.trim()) params.set('redirect', options.redirect.trim());
  if (options?.focus?.trim()) params.set('focus', options.focus.trim());
  if (
    options?.scrollY != null &&
    Number.isFinite(options.scrollY) &&
    options.scrollY >= 0
  ) {
    params.set('scrollY', String(Math.round(options.scrollY)));
  }
  const qs = params.toString();
  return qs ? `${SIGNIN_PATH}?${qs}` : SIGNIN_PATH;
};

export const hostActivitiesCheckInPath = (activityId: string): string =>
  `${HOST_ACTIVITIES_PATH}?checkin=${encodeURIComponent(activityId)}`;

export const messagesToUserPath = (userId: string): string =>
  `${MESSAGES_PATH}?to=${encodeURIComponent(userId)}`;

export const messagesGroupPath = (groupId: string): string =>
  `${MESSAGES_PATH}?group=${encodeURIComponent(groupId)}`;

export const myRequestDetailPath = (requestId: string): string =>
  `${MY_REQUESTS_PATH}/${encodeURIComponent(requestId)}`;

/** Removed Trail Points wallet — legacy URLs redirect to badges in `App.tsx` */
export const LEGACY_TRAIL_POINTS_PATH = '/trail-points' as const;
export const LEGACY_MY_REWARDS_PATH = '/my-rewards' as const;
export const LEGACY_REWARDS_PATH = '/rewards' as const;

export const isLegacyRewardsWalletPath = (pathname: string): boolean =>
  pathname === LEGACY_MY_REWARDS_PATH ||
  pathname === LEGACY_REWARDS_PATH ||
  pathname === LEGACY_TRAIL_POINTS_PATH ||
  pathname.startsWith(`${LEGACY_TRAIL_POINTS_PATH}?`);
