/**
 * Consumer surface paths (secondary hubs, profile).
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
  pathname === PROFILE_HISTORY_PATH || pathname.endsWith('/profile/history');

export const isJourneyMapPath = (pathname: string): boolean =>
  pathname === JOURNEY_MAP_PATH || pathname.endsWith('/profile/history/map');

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
/** Guide ladder — bio, languages, experience; gates community host / publish (MIG-SCHEDULE-GUIDE). */
export const PROFILE_GUIDE_PATH = '/profile/guide' as const;
export const guideProfilePath = (returnTo?: string): string => {
  const base = PROFILE_GUIDE_PATH;
  if (!returnTo?.trim()) return base;
  return `${base}?redirect=${encodeURIComponent(returnTo.trim())}`;
};
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

export const isAppSettingsPath = (pathname: string): boolean =>
  pathname === APP_SETTINGS_PATH || pathname.startsWith(`${APP_SETTINGS_PATH}/`);

/** In-app notification hub — history, preferences, saved map alerts (under Settings). */
export const isNotificationHubPath = (pathname: string): boolean =>
  pathname === APP_SETTINGS_NOTIFICATIONS_PATH ||
  pathname.startsWith(`${APP_SETTINGS_NOTIFICATIONS_PATH}/`);

/** Member achievement badges (no Trail Points wallet) */
export const PROFILE_BADGES_PATH = '/profile/badges' as const;

/** Social subgraph */
export const GROUPS_PATH = '/groups' as const;

/** Discoverable club detail (`MIG-COMMUNITY-DISCOVER`) — not retired `/community` feed. */
export const COMMUNITY_CLUB_PATH_PREFIX = '/clubs' as const;
export const communityClubPath = (slug: string): string =>
  `${COMMUNITY_CLUB_PATH_PREFIX}/${encodeURIComponent(slug)}`;
/** My Crews friends hub — canonical SPA route. */
export const MY_CREWS_PATH = '/crews' as const;

/** Query on `/crews` or `/groups` when opened from the Crews list hub — back returns to `crewsHomePath()`. */
export const CREWS_ORIGIN_QUERY = 'crews' as const;

export const isCrewsOriginQuery = (from: string | null | undefined): boolean =>
  from === CREWS_ORIGIN_QUERY;

export const myCrewsPath = (options?: { from?: string }): string => {
  if (!options?.from) return MY_CREWS_PATH;
  const params = new URLSearchParams({ from: options.from });
  return `${MY_CREWS_PATH}?${params.toString()}`;
};


/** Social hub child screens under {@link MY_CREWS_PATH} (Settings-style sections, not tabs). */
export type SocialFriendsSection = 'friends' | 'requests' | 'following';

export const socialFriendsPath = (): string => `${MY_CREWS_PATH}?section=friends`;
export const socialRequestsPath = (): string => `${MY_CREWS_PATH}?section=requests`;
export const socialFollowingPath = (): string => `${MY_CREWS_PATH}?section=following`;
export const PROFILE_SUBMISSIONS_PATH = '/profile/submissions' as const;

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

/** Consumer inbox + threads — keep string literal in sync with `apps/api/src/lib/member-routes.ts`. */
export const MESSAGES_PATH = '/chat' as const;
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


export const myRequestDetailPath = (requestId: string): string =>
  `${MY_REQUESTS_PATH}/${encodeURIComponent(requestId)}`;