/**
 * Backend Wire Lexicon (BWL) — technical names for HTTP, JSON, Mongo, and internal modules.
 * **Not** user-facing copy. UI strings live in `src/content/upl-glossary.ts` (UPL).
 *
 * Implementation schedule: docs/SYSTEM_COHERENCE.md §8.8 · migrations MIG-COH-*.
 */

/** Mongo collection names (canonical). Target renames noted inline. */
export const BWL_COLLECTIONS = {
  ACTIVITIES: 'activities',
  ACTIVITY_REQUESTS: 'activity_requests',
  ACTIVITY_PARTICIPANTS: 'activity_participants',
  ACTIVITY_INVITES: 'activity_invites',
  /** @deprecated Remove after MIG-COH-01 — seeking lives on activities.activity_mode */
  PARTICIPANT_INTENTS: 'participant_intents',
  /** @deprecated Remove after MIG-COH-01 */
  PARTICIPANT_INTENT_REQUESTS: 'participant_intent_requests',
  LOCATIONS: 'locations',
  /** Target name (MIG-COH-02 optional) */
  PLACES: 'places',
  FACILITIES: 'facilities',
  AREAS: 'areas',
  TENANTS: 'tenants',
  TENANT_MEMBERSHIPS: 'tenant_memberships',
  /** Collection stays `host_applications` until optional rename (MIG-COH-03 / COH-12). */
  HOST_APPLICATIONS: 'host_applications',
  /** Target collection name — HTTP is `/me/pro-application` now. */
  PRO_APPLICATIONS: 'pro_applications',
  AUTH_USERS: 'auth_users',
  BUDDY_REQUESTS: 'buddy_requests',
  BUDDY_PAIRS: 'buddy_pairs',
  USER_FOLLOWS: 'user_follows',
  ENTITY_FOLLOWS: 'entity_follows',
  MEMBER_AVAILABILITY: 'member_availability',
  USER_GOALS: 'user_goals',
  /** Target: user_wishlist (MIG-COH-09) */
  USER_WISHLIST: 'user_favorites',
  SOCIAL_REVIEWS: 'social_reviews',
  CHAT_MESSAGES: 'chat_messages',
  CONTENT_REPORTS: 'content_reports',
  SIDE_EFFECT_OUTBOX: 'side_effect_outbox',
} as const;

export type ActivityModeWire = 'hosted' | 'seeking';

/** Activity document person fields (BWL). UPL label: Host. */
export const BWL_ACTIVITY_PERSON_FIELDS = {
  HOST_ID: 'host_id',
  CREATED_BY_ID: 'created_by_id',
} as const;

/**
 * Join request messages (BWL).
 * - `note` — joiner → host
 * - `organizer_note` — host decision message (target rename: `host_note`, MIG-COH-06)
 */
export const BWL_JOIN_REQUEST_FIELDS = {
  NOTE: 'note',
  ORGANIZER_NOTE: 'organizer_note',
  TARGET_HOST_NOTE: 'host_note',
} as const;

/** HTTP mount prefixes (current → target). */
export const BWL_API_MOUNTS = {
  PUBLISHING_WORKSPACE: '/publishing',
  /** @deprecated Alias of PUBLISHING_WORKSPACE */
  PUBLISHING_WORKSPACE_CURRENT: '/operator',
  PUBLISHING_WORKSPACE_TARGET: '/publishing',
  MEMBER_DISCOVERY_CURRENT: '/me/member-discovery',
  /** Optional target; default keep member-discovery */
  PEOPLE_DISCOVERY_TARGET: '/me/people',
  PLACES_TARGET: '/places',
  /** @deprecated Alias of PRO_APPLICATION */
  PRO_APPLICATION_CURRENT: '/me/host-application',
  PRO_APPLICATION: '/me/pro-application',
  PRO_APPLICATION_TARGET: '/me/pro-application',
  ADMIN_PRO_APPLICATIONS: '/admin/pro-applications',
  SAFETY_REPORTS: '/safety/reports',
  /** Member seeking posts (activity-backed). */
  SEEKING_POSTS: '/me/seeking-posts',
} as const;

/**
 * Explore map item `source` — one lexicon for presentation, person, and plan projection.
 *
 * Canonical emit: activity · place · facility · shop · agency.
 * Area is **not** a pin — admin-curated name; country/state/region come from map geography.
 * Legacy read-only: venue / catalog_place → place; demand → activity; area → drop from map.
 */
export const BWL_EXPLORE_MAP_SOURCE = {
  ACTIVITY: 'activity',
  PLACE: 'place',
  FACILITY: 'facility',
  SHOP: 'shop',
  AGENCY: 'agency',
  /** @deprecated Read compat — Place pin on Spots (`id` prefix `venue:`). */
  VENUE_LEGACY: 'venue',
  /** @deprecated Brief COH-02 target; use `place`. */
  CATALOG_PLACE_LEGACY: 'catalog_place',
  /** @deprecated Seeking is `activity` + `activityMode: seeking` (MIG-COH-01). */
  DEMAND_LEGACY: 'demand',
  /** @deprecated Synthetic hub pin — Area is a label, not a map source. */
  AREA_LEGACY: 'area',
} as const;

export type ExploreMapSourceCanonical =
  | typeof BWL_EXPLORE_MAP_SOURCE.ACTIVITY
  | typeof BWL_EXPLORE_MAP_SOURCE.PLACE
  | typeof BWL_EXPLORE_MAP_SOURCE.FACILITY
  | typeof BWL_EXPLORE_MAP_SOURCE.SHOP
  | typeof BWL_EXPLORE_MAP_SOURCE.AGENCY;

export type ExploreMapSourceWire =
  | ExploreMapSourceCanonical
  | typeof BWL_EXPLORE_MAP_SOURCE.VENUE_LEGACY
  | typeof BWL_EXPLORE_MAP_SOURCE.CATALOG_PLACE_LEGACY
  | typeof BWL_EXPLORE_MAP_SOURCE.DEMAND_LEGACY
  | typeof BWL_EXPLORE_MAP_SOURCE.AREA_LEGACY;

export const PLACE_MAP_SOURCE = BWL_EXPLORE_MAP_SOURCE.PLACE;
export const FACILITY_MAP_SOURCE = BWL_EXPLORE_MAP_SOURCE.FACILITY;

export const isPlaceMapSource = (source: string | null | undefined): boolean =>
  source === BWL_EXPLORE_MAP_SOURCE.PLACE ||
  source === BWL_EXPLORE_MAP_SOURCE.VENUE_LEGACY ||
  source === BWL_EXPLORE_MAP_SOURCE.CATALOG_PLACE_LEGACY;

export const isFacilityMapSource = (source: string | null | undefined): boolean =>
  source === BWL_EXPLORE_MAP_SOURCE.FACILITY;

/** Place catalog + facility amenity pins (both have coords for map navigation). */
export const isGeographyMapSource = (source: string | null | undefined): boolean =>
  isPlaceMapSource(source) || isFacilityMapSource(source);

export const normalizeExploreMapSource = (source: ExploreMapSourceWire): ExploreMapSourceWire => {
  if (isPlaceMapSource(source)) return BWL_EXPLORE_MAP_SOURCE.PLACE;
  if (source === BWL_EXPLORE_MAP_SOURCE.DEMAND_LEGACY) return BWL_EXPLORE_MAP_SOURCE.ACTIVITY;
  return source;
};

/** Social graph — never use "friend" in BWL; segment target `buddies`. */
export const BWL_PEOPLE_SEGMENT = {
  ALL: 'all',
  BUDDIES_TARGET: 'buddies',
  FRIENDS_LEGACY: 'friends',
  FOLLOWED: 'followed',
} as const;

/** RBAC — orthogonal to publish tier and UPL. */
export const BWL_USER_ROLES = [
  'PLATFORM_ADMIN',
  'TENANT_OWNER',
  'TENANT_ADMIN',
  'TENANT_GUIDE',
  'PARTICIPANT',
] as const;
