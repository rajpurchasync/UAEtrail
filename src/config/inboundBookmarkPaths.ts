/**
 * Stale URL pathnames — literals for notification deep-link normalization only.
 * Do not register SPA routes or link from product UI.
 */

export const INBOUND_PLAN_HUB_TRIPS_PATH = '/trips' as const;
export const INBOUND_PLAN_HUB_TRIPS_MAP_PATH = '/trips/map' as const;
export const INBOUND_PLAN_HUB_ACTIVITIES_PATH = '/activities' as const;

export const INBOUND_PROFILE_HISTORY_ALIAS_PATH = '/profile/my-trips' as const;
export const INBOUND_JOURNEY_MAP_ALIAS_PATH = '/profile/my-trips/map' as const;

/** Retired profile-nested settings URLs — normalize stale notification links only. */
export const INBOUND_APP_SETTINGS_PATH = '/profile/settings' as const;
export const INBOUND_APP_SETTINGS_ACCOUNT_PATH = '/profile/settings/account' as const;
export const INBOUND_APP_SETTINGS_PRIVACY_PATH = '/profile/settings/privacy' as const;
export const INBOUND_APP_SETTINGS_NOTIFICATIONS_PATH = '/profile/settings/notifications' as const;
export const INBOUND_APP_SETTINGS_SAFETY_PATH = '/profile/settings/safety' as const;

/** Retired community Q&A feed — no route; literal kept for stale link detection. */
export const INBOUND_COMMUNITY_FEED_PATH = '/community' as const;

/** Retired explore entry bookmarks — canonical `/explore`. */
export const INBOUND_LEGACY_MAP_PATH = '/map' as const;
export const INBOUND_LEGACY_DISCOVERY_PATH = '/discovery' as const;

/** Retired friends list bookmark — canonical `/crews`. */
export const INBOUND_BUDDIES_PATH = '/buddies' as const;

/** Retired submissions hub — canonical `/profile/submissions`. */
export const INBOUND_CONTRIBUTIONS_PATH = '/contributions' as const;

/** Retired Trail Points wallet paths — canonical `/profile/badges`. */
export const INBOUND_REWARDS_PATH = '/rewards' as const;
export const INBOUND_MY_REWARDS_PATH = '/my-rewards' as const;
export const INBOUND_TRAIL_POINTS_PATH = '/trail-points' as const;

/** Retired profile wishlist hub — canonical Plan wishlist tab. */
export const INBOUND_PROFILE_WISHLIST_PATH = '/profile/wishlist' as const;

export const INBOUND_PLAN_HUB_PATHNAMES = new Set<string>([
  INBOUND_PLAN_HUB_TRIPS_PATH,
  INBOUND_PLAN_HUB_TRIPS_MAP_PATH,
  INBOUND_PLAN_HUB_ACTIVITIES_PATH,
]);
