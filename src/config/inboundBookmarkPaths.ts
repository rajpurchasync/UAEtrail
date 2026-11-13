/**
 * Retired URL pathnames — used only for notification deep-link normalization
 * and auth/chrome matchers. Do not register SPA routes or link from product UI.
 */

export const INBOUND_PLAN_HUB_TRIPS_PATH = '/trips' as const;
export const INBOUND_PLAN_HUB_TRIPS_MAP_PATH = '/trips/map' as const;
export const INBOUND_PLAN_HUB_ACTIVITIES_PATH = '/activities' as const;

export const INBOUND_PROFILE_HISTORY_ALIAS_PATH = '/profile/my-trips' as const;
export const INBOUND_JOURNEY_MAP_ALIAS_PATH = '/profile/my-trips/map' as const;

/** Retired profile-nested settings URLs → `/settings` (see `InboundLegacyProfileSettingsRedirect`). */
export {
  INBOUND_PROFILE_SETTINGS_PATH,
  INBOUND_PROFILE_SETTINGS_ACCOUNT_PATH,
  INBOUND_PROFILE_SETTINGS_PRIVACY_PATH,
  INBOUND_PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  INBOUND_PROFILE_SETTINGS_SAFETY_PATH,
} from './surfacePaths';

/** Retired community Q&A feed — no route; literal kept for stale link detection. */
export const INBOUND_COMMUNITY_FEED_PATH = '/community' as const;

export const INBOUND_PLAN_HUB_PATHNAMES = new Set<string>([
  INBOUND_PLAN_HUB_TRIPS_PATH,
  INBOUND_PLAN_HUB_TRIPS_MAP_PATH,
  INBOUND_PLAN_HUB_ACTIVITIES_PATH,
]);
