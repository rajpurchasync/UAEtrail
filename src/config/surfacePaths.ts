/**
 * Consumer surface paths (secondary hubs, profile, inbound redirect bookmarks).
 * No imports — safe for platform.ts and routingCatalog.
 *
 * @see docs/NAVIGATION.md · docs/DOMAIN_CANONICALS.md
 */

/** Personal hub */
export const PROFILE_PATH = '/profile' as const;

/** Active member tab — goals, upcoming, plan attention (`docs/NAVIGATION.md`). */
export const PLAN_PATH = '/plan' as const;

/** Profile outing history (joined / hosted / self past) — canonical URL. */
export const PROFILE_HISTORY_PATH = '/profile/history' as const;
/** Member journey map (pins + wishlist visited). */
export const JOURNEY_MAP_PATH = '/profile/history/map' as const;

/** @deprecated Bookmark — `App.tsx` redirects to {@link PROFILE_HISTORY_PATH}. */
export const MY_TRIPS_PATH = '/profile/my-trips' as const;
/** @deprecated Bookmark — `App.tsx` redirects to {@link JOURNEY_MAP_PATH}. */
export const MY_TRIPS_MAP_PATH = '/profile/my-trips/map' as const;

export const isProfileHistoryListPath = (pathname: string): boolean =>
  pathname === PROFILE_HISTORY_PATH ||
  pathname === MY_TRIPS_PATH ||
  pathname.endsWith('/profile/history') ||
  pathname.endsWith('/my-trips');

export const isJourneyMapPath = (pathname: string): boolean =>
  pathname === JOURNEY_MAP_PATH ||
  pathname === MY_TRIPS_MAP_PATH ||
  pathname.endsWith('/profile/history/map') ||
  pathname.endsWith('/my-trips/map');

/** Inbound bookmark — `App.tsx` redirects to {@link PLAN_PATH}. */
export const INBOUND_ACTIVITIES_HUB_PATH = '/activities' as const;

/** Inbound bookmark — `App.tsx` redirects to {@link PLAN_PATH} or {@link PROFILE_HISTORY_PATH}. */
export const TRIPS_PATH = '/trips' as const;
/** Inbound bookmark — redirects to {@link JOURNEY_MAP_PATH}. */
export const INBOUND_TRIPS_MAP_PATH = '/trips/map' as const;

/** Admin / host place registry consoles */
export const ADMIN_PLACES_PATH = '/admin/places' as const;

/** Publishing workspace SPA prefix (MIG-COH-04). */
export const PUBLISHING_CONSOLE_PREFIX = '/publishing' as const;

/** Publishing console (organizer + operator tenants) — canonical URLs. Sync `apps/api/src/lib/member-routes.ts`. */
export const PUBLISHING_OVERVIEW_PATH = '/publishing/overview' as const;
export const PUBLISHING_ACTIVITIES_PATH = '/publishing/activities' as const;
export const PUBLISHING_ACTIVITIES_NEW_PATH = '/publishing/activities/new' as const;
export const PUBLISHING_REQUESTS_PATH = '/publishing/requests' as const;
export const PUBLISHING_TEAM_PATH = '/publishing/team' as const;
export const PUBLISHING_PROFILE_PATH = '/publishing/profile' as const;
export const PUBLISHING_HISTORY_PATH = '/publishing/history' as const;
export const PUBLISHING_PLACES_PATH = '/publishing/places' as const;
export const PUBLISHING_SECURITY_PRIVACY_PATH = '/publishing/security-privacy' as const;

export const PROFILE_EDIT_PATH = '/profile/edit' as const;
export const PROFILE_REVIEWS_PATH = '/profile/reviews' as const;
export const PROFILE_SETTINGS_PATH = '/profile/settings' as const;
export const PROFILE_SETTINGS_ACCOUNT_PATH = '/profile/settings/account' as const;
export const PROFILE_SETTINGS_PRIVACY_PATH = '/profile/settings/privacy' as const;
export const PROFILE_SETTINGS_NOTIFICATIONS_PATH = '/profile/settings/notifications' as const;

/** Member achievement badges (no Trail Points wallet) */
export const PROFILE_BADGES_PATH = '/profile/badges' as const;

/** Inbound bookmark — redirects to explore (`App.tsx`). */
export const COMMUNITY_PATH = '/community' as const;

/** Inbound bookmark — App.tsx redirects to explore. */
export const MEMBERSHIP_MARKETING_PATH = '/membership' as const;

/** Social subgraph */
export const GROUPS_PATH = '/groups' as const;
export const BUDDIES_PATH = '/buddies' as const;
export const PROFILE_SUBMISSIONS_PATH = '/profile/submissions' as const;

/** Inbound bookmark — redirects to {@link PROFILE_SUBMISSIONS_PATH}. */
export const INBOUND_CONTRIBUTIONS_PATH = '/contributions' as const;

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

/** List/manage surface only — threads use {@link messagesGroupPath}. */
export const groupsManagePath = (
  groupId: string,
  tab: 'members' | 'manage' = 'members'
): string => {
  const params = new URLSearchParams({ group: groupId, tab });
  return `${GROUPS_PATH}?${params.toString()}`;
};

/** In-app notification inbox */
export const NOTIFICATIONS_PATH = '/notifications' as const;

/** Consumer inbox + threads — keep string literal in sync with `apps/api/src/lib/member-routes.ts`. */
export const MESSAGES_PATH = '/chat' as const;
/** Inbound bookmark — redirects to {@link MESSAGES_PATH} in `App.tsx`. */
export const INBOUND_MESSAGES_PATH = '/messages' as const;
export const MY_REQUESTS_PATH = '/my-requests' as const;

export const isPublishingConsolePath = (pathname: string): boolean =>
  pathname.startsWith(`${PUBLISHING_CONSOLE_PREFIX}/`) ||
  pathname === PUBLISHING_CONSOLE_PREFIX;

/** Auth funnel */
export const SIGNIN_PATH = '/signin' as const;
export const SIGNUP_PATH = '/signup' as const;
export const WELCOME_PATH = '/welcome' as const;
export const VERIFY_PATH = '/verify' as const;
export const FORGOT_PASSWORD_PATH = '/forgot-password' as const;

const authFunnelQuery = (options?: {
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
  return params.toString();
};

export const signInPath = (options?: {
  redirect?: string;
  focus?: string;
  scrollY?: number;
}): string => {
  const qs = authFunnelQuery(options);
  return qs ? `${SIGNIN_PATH}?${qs}` : SIGNIN_PATH;
};

export const signUpPath = (options?: {
  redirect?: string;
  focus?: string;
  scrollY?: number;
}): string => {
  const qs = authFunnelQuery(options);
  return qs ? `${SIGNUP_PATH}?${qs}` : SIGNUP_PATH;
};

/** Publishing console → activity participants roster (`checkin=` still accepted on Plan). */
export const publishingActivitiesCheckInPath = (activityId: string): string =>
  `${PUBLISHING_ACTIVITIES_PATH}?roster=${encodeURIComponent(activityId)}`;

export const messagesToUserPath = (userId: string): string =>
  `${MESSAGES_PATH}?to=${encodeURIComponent(userId)}`;

export const messagesGroupPath = (groupId: string, activityId?: string): string => {
  const params = new URLSearchParams({ group: groupId });
  if (activityId?.trim()) params.set('activity', activityId.trim());
  return `${MESSAGES_PATH}?${params.toString()}`;
};

export const myRequestDetailPath = (requestId: string): string =>
  `${MY_REQUESTS_PATH}/${encodeURIComponent(requestId)}`;

/** Removed Trail Points wallet — inbound URLs redirect to badges in `App.tsx`. */
export const INBOUND_TRAIL_POINTS_PATH = '/trail-points' as const;
export const INBOUND_MY_REWARDS_PATH = '/my-rewards' as const;
export const INBOUND_REWARDS_PATH = '/rewards' as const;

export const isInboundRewardsWalletPath = (pathname: string): boolean =>
  pathname === INBOUND_MY_REWARDS_PATH ||
  pathname === INBOUND_REWARDS_PATH ||
  pathname === INBOUND_TRAIL_POINTS_PATH ||
  pathname.startsWith(`${INBOUND_TRAIL_POINTS_PATH}?`);
