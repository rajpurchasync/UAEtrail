/**
 * Consumer surface paths (secondary hubs, profile, inbound redirect bookmarks).
 * No imports — safe for platform.ts and routingCatalog.
 *
 * @see docs/NAVIGATION.md · docs/DOMAIN_CANONICALS.md
 */

/** Personal hub */
export const PROFILE_PATH = '/profile' as const;

/** Member garage for rideshare hosts. */
export const PROFILE_VEHICLES_PATH = '/profile/vehicles' as const;

/** Active member tab — goals, upcoming, plan attention (`docs/NAVIGATION.md`). */
export const PLAN_PATH = '/plan' as const;
/** Signed-in “today” briefing for the next joined outing. */
export const PLAN_TODAY_PATH = '/plan/today' as const;

/**
 * Community hosting hub — dedicated surface (not My Plans).
 * Legacy inbound: `/plan?filter=hosting` redirects here.
 */
export const HOSTING_HUB_PATH = '/hosting' as const;

export const GEO_TREE_PATH = '/geo' as const;
export const geoNodePath = (idOrPath: string): string =>
  `/geo/n/${encodeURIComponent(idOrPath)}`;
export const geoCountryPath = (code: string): string =>
  `/geo/country/${encodeURIComponent(code.toLowerCase())}`;

/** Profile outing history (joined / hosted / self past) — canonical URL. */
export const PROFILE_HISTORY_PATH = '/profile/history' as const;
/** Member journey map (pins + wishlist visited). */
export const JOURNEY_MAP_PATH = '/profile/history/map' as const;

export const isProfileHistoryListPath = (pathname: string): boolean =>
  pathname === PROFILE_HISTORY_PATH ||
  pathname === '/profile/my-trips' ||
  pathname.endsWith('/profile/history') ||
  pathname.endsWith('/my-trips');

export const isJourneyMapPath = (pathname: string): boolean =>
  pathname === JOURNEY_MAP_PATH ||
  pathname === '/profile/my-trips/map' ||
  pathname.endsWith('/profile/history/map') ||
  pathname.endsWith('/my-trips/map');

/** Admin / host place registry consoles */
export const ADMIN_PLACES_PATH = '/admin/places' as const;

/** Operator workspace SPA prefix (HOST-SURFACE-UNIFY · MIG-PLATFORM-COMPOSE-OPERATOR-2026). */
export const OPERATOR_CONSOLE_PREFIX = '/operator' as const;

/** Operator console (community host + tenant workspaces) — canonical URLs. Sync `apps/api/src/lib/member-routes.ts`. */
export const OPERATOR_OVERVIEW_PATH = '/operator/overview' as const;
export const OPERATOR_ACTIVITIES_PATH = '/operator/activities' as const;
export const OPERATOR_ACTIVITIES_NEW_PATH = '/operator/activities/new' as const;
export const OPERATOR_REQUESTS_PATH = '/operator/requests' as const;
export const OPERATOR_TEAM_PATH = '/operator/team' as const;
export const OPERATOR_PROFILE_PATH = '/operator/profile' as const;
export const OPERATOR_HISTORY_PATH = '/operator/history' as const;
export const OPERATOR_PLACES_PATH = '/operator/places' as const;
export const OPERATOR_SECURITY_PRIVACY_PATH = '/operator/security-privacy' as const;

export const PROFILE_EDIT_PATH = '/profile/edit' as const;
export const PROFILE_REVIEWS_PATH = '/profile/reviews' as const;

/** App settings hub (display, account, privacy, safety) — not edit profile (`PROFILE_EDIT_PATH`). */
export const APP_SETTINGS_PATH = '/settings' as const;
export const APP_SETTINGS_DISPLAY_PATH = '/settings/display' as const;
export const APP_SETTINGS_ACCOUNT_PATH = '/settings/account' as const;
export const APP_SETTINGS_PRIVACY_PATH = '/settings/privacy' as const;
export const APP_SETTINGS_NOTIFICATIONS_PATH = '/settings/notifications' as const;
export const APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH =
  '/settings/notifications/preferences' as const;
export const APP_SETTINGS_NOTIFICATIONS_SAVED_PATH = '/settings/notifications/saved' as const;
export const APP_SETTINGS_SAFETY_PATH = '/settings/safety' as const;

/** @deprecated Bookmarks only — SPA redirects to {@link APP_SETTINGS_PATH}. */
export const INBOUND_PROFILE_SETTINGS_PATH = '/profile/settings' as const;
export const INBOUND_PROFILE_SETTINGS_ACCOUNT_PATH = '/profile/settings/account' as const;
export const INBOUND_PROFILE_SETTINGS_PRIVACY_PATH = '/profile/settings/privacy' as const;
export const INBOUND_PROFILE_SETTINGS_NOTIFICATIONS_PATH = '/profile/settings/notifications' as const;
export const INBOUND_PROFILE_SETTINGS_SAFETY_PATH = '/profile/settings/safety' as const;

/** Prefer `APP_SETTINGS_*` in new code. */
export const PROFILE_SETTINGS_PATH = APP_SETTINGS_PATH;
export const PROFILE_SETTINGS_DISPLAY_PATH = APP_SETTINGS_DISPLAY_PATH;
export const PROFILE_SETTINGS_ACCOUNT_PATH = APP_SETTINGS_ACCOUNT_PATH;
export const PROFILE_SETTINGS_PRIVACY_PATH = APP_SETTINGS_PRIVACY_PATH;
export const PROFILE_SETTINGS_NOTIFICATIONS_PATH = APP_SETTINGS_NOTIFICATIONS_PATH;
export const PROFILE_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH = APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH;
export const PROFILE_SETTINGS_NOTIFICATIONS_SAVED_PATH = APP_SETTINGS_NOTIFICATIONS_SAVED_PATH;
export const PROFILE_SETTINGS_SAFETY_PATH = APP_SETTINGS_SAFETY_PATH;

export const isAppSettingsPath = (pathname: string): boolean =>
  pathname === APP_SETTINGS_PATH || pathname.startsWith(`${APP_SETTINGS_PATH}/`);

/** In-app notification hub — history, preferences, saved map alerts (under Settings). */
export const isNotificationHubPath = (pathname: string): boolean =>
  pathname === NOTIFICATIONS_PATH ||
  pathname.startsWith(`${NOTIFICATIONS_PATH}/`) ||
  pathname === APP_SETTINGS_NOTIFICATIONS_PATH ||
  pathname.startsWith(`${APP_SETTINGS_NOTIFICATIONS_PATH}/`);

export const isInboundProfileSettingsPath = (pathname: string): boolean =>
  pathname === INBOUND_PROFILE_SETTINGS_PATH || pathname.startsWith(`${INBOUND_PROFILE_SETTINGS_PATH}/`);

/** Map retired `/profile/settings…` bookmarks to canonical `/settings…` (path only). */
export const inboundProfileSettingsRedirectTarget = (pathname: string): string => {
  const suffix = pathname.replace(/^\/profile\/settings/, '') || '';
  return `${APP_SETTINGS_PATH}${suffix}`;
};

/** Member achievement badges (no Trail Points wallet) */
export const PROFILE_BADGES_PATH = '/profile/badges' as const;

/** Inbound bookmark — App.tsx redirects to explore. */
export const MEMBERSHIP_MARKETING_PATH = '/membership' as const;

/** Social subgraph */
export const GROUPS_PATH = '/groups' as const;
export const BUDDIES_PATH = '/buddies' as const;

/** Query on `/buddies` or `/groups` when opened from the Crews list hub — back returns to `crewsHomePath()`. */
export const CREWS_ORIGIN_QUERY = 'crews' as const;

export const isCrewsOriginQuery = (from: string | null | undefined): boolean =>
  from === CREWS_ORIGIN_QUERY;

export const buddiesPath = (options?: { from?: string }): string => {
  if (!options?.from) return BUDDIES_PATH;
  const params = new URLSearchParams({ from: options.from });
  return `${BUDDIES_PATH}?${params.toString()}`;
};

/** Social hub child screens under `/buddies` (Settings-style sections, not tabs). */
export type SocialFriendsSection = 'friends' | 'requests' | 'following';

export const socialFriendsPath = (): string => `${BUDDIES_PATH}?section=friends`;
export const socialRequestsPath = (): string => `${BUDDIES_PATH}?section=requests`;
export const socialFollowingPath = (): string => `${BUDDIES_PATH}?section=following`;
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

/** Settings-style sections inside a Social group (hub = menu index). */
export type GroupManageSection = 'hub' | 'members' | 'edit';

export type GroupMembersFocus = 'invite' | 'add-kid';

/** Legacy section slugs still accepted in URLs and normalized at runtime. */
export type GroupManagePathArg =
  | GroupManageSection
  | 'manage'
  | 'settings'
  | 'invite'
  | 'kids';

export const normalizeGroupManageSection = (
  section: string | null,
  legacyTab?: string | null
): GroupManageSection => {
  if (section === 'members' || section === 'edit') return section;
  if (section === 'invite' || section === 'kids' || legacyTab === 'members') return 'members';
  if (section === 'settings' || section === 'manage' || legacyTab === 'manage') return 'edit';
  return 'hub';
};

export const groupManageFocusFromLegacySection = (
  section: string | null
): GroupMembersFocus | undefined => {
  if (section === 'invite') return 'invite';
  if (section === 'kids') return 'add-kid';
  return undefined;
};

/** List/manage surface only — threads use {@link messagesGroupPath}. */
export const groupsManagePath = (
  groupId: string,
  section: GroupManagePathArg = 'hub',
  options?: { focus?: GroupMembersFocus; from?: string }
): string => {
  const rawSection = section;
  const normalized = normalizeGroupManageSection(rawSection, null);
  const params = new URLSearchParams({ group: groupId });
  if (normalized !== 'hub') params.set('section', normalized);
  const focus =
    options?.focus ??
    (rawSection === 'invite' || rawSection === 'kids' ? groupManageFocusFromLegacySection(rawSection) : undefined);
  if (focus && normalized === 'members') params.set('focus', focus);
  if (options?.from) params.set('from', options.from);
  return `${GROUPS_PATH}?${params.toString()}`;
};

/** Inbound bookmarks — SPA redirects to {@link APP_SETTINGS_NOTIFICATIONS_PATH} and sub-routes. */
export const NOTIFICATIONS_PATH = '/notifications' as const;
export const NOTIFICATIONS_SETTINGS_PATH = '/notifications/settings' as const;
export const NOTIFICATIONS_SAVED_PATH = '/notifications/saved' as const;

/** Map retired `/notifications…` bookmarks to canonical settings notification routes. */
export const inboundNotificationsRedirectTarget = (pathname: string): string => {
  if (pathname.startsWith(NOTIFICATIONS_SETTINGS_PATH)) {
    return APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH;
  }
  if (pathname.startsWith(NOTIFICATIONS_SAVED_PATH)) {
    return APP_SETTINGS_NOTIFICATIONS_SAVED_PATH;
  }
  return APP_SETTINGS_NOTIFICATIONS_PATH;
};

/** Consumer inbox + threads — keep string literal in sync with `apps/api/src/lib/member-routes.ts`. */
export const MESSAGES_PATH = '/chat' as const;
/** Inbound bookmark — redirects to {@link MESSAGES_PATH} in `App.tsx`. */
export const INBOUND_MESSAGES_PATH = '/messages' as const;
export const MY_REQUESTS_PATH = '/my-requests' as const;

export const isOperatorConsolePath = (pathname: string): boolean =>
  pathname.startsWith(`${OPERATOR_CONSOLE_PREFIX}/`) ||
  pathname === OPERATOR_CONSOLE_PREFIX;

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

/** Guest home query after a refresh/session wipe (`/?session=expired`). */
export const SESSION_EXPIRED_QUERY_KEY = 'session' as const;
export const SESSION_EXPIRED_QUERY_VALUE = 'expired' as const;

export const sessionExpiredHomePath = (): string =>
  `/?${SESSION_EXPIRED_QUERY_KEY}=${SESSION_EXPIRED_QUERY_VALUE}`;

export const hasSessionExpiredQuery = (search: URLSearchParams): boolean =>
  search.get(SESSION_EXPIRED_QUERY_KEY) === SESSION_EXPIRED_QUERY_VALUE;

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

/** Host roster page. Same URL as `activityCrewPath` (this module cannot import shared-types). */
export const publishingActivitiesCheckInPath = (activityId: string): string =>
  `/activity/${activityId}/crew`;

export const messagesToUserPath = (userId: string): string =>
  `${MESSAGES_PATH}?to=${encodeURIComponent(userId)}`;

/** Opens the group wall thread on `/chat`. */
export const messagesGroupPath = (groupId: string, activityId?: string): string => {
  const params = new URLSearchParams({ group: groupId, chat: '1' });
  if (activityId?.trim()) params.set('activity', activityId.trim());
  return `${MESSAGES_PATH}?${params.toString()}`;
};

/** @deprecated Alias of {@link messagesGroupPath} — inbox opens the thread directly. */
export const messagesGroupChatPath = messagesGroupPath;

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
