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
  /** Public detail-surface safety / ops banners (plan detail pages). */
  PLATFORM_ALERTS: 'platform_alerts',
  /** Partner outbound click telemetry (commercial facilities / shops). */
  REFERRAL_CLICKS: 'referral_clicks',
  /**
   * Curated destinations store — physical Mongo collection `areas`; document ids e.g. `area-seed-*`.
   */
  DESTINATIONS: 'areas',
  GEO_NODES: 'geo_nodes',
  GEO_STATS: 'geo_stats',
  GEO_OUTBOX: 'geo_outbox',
  GEO_META: 'geo_meta',
  SUBMISSIONS: 'submissions',
  AMENITY_REPORTS: 'amenity_reports',
  MERGES: 'merges',
  CATALOGS: 'catalogs',
  VERIFICATION_DOCUMENTS: 'verification_documents',
  PAYMENTS: 'payments',
  TENANTS: 'tenants',
  TENANT_MEMBERSHIPS: 'tenant_memberships',
  /** Collection stays `host_applications` until optional rename (MIG-COH-03 / COH-12). */
  HOST_APPLICATIONS: 'host_applications',
  /** Target collection name — HTTP is `/me/pro-application` now. */
  PRO_APPLICATIONS: 'pro_applications',
  AUTH_USERS: 'auth_users',
  FRIEND_REQUESTS: 'friend_requests',
  FRIEND_PAIRS: 'friend_pairs',
  USER_FOLLOWS: 'user_follows',
  ENTITY_FOLLOWS: 'entity_follows',
  MEMBER_AVAILABILITY: 'member_availability',
  USER_GOALS: 'user_goals',
  USER_WISHLIST: 'user_wishlist',
  SOCIAL_REVIEWS: 'social_reviews',
  CHAT_MESSAGES: 'chat_messages',
  CONTENT_REPORTS: 'content_reports',
  SIDE_EFFECT_OUTBOX: 'side_effect_outbox',
} as const;

/** Catalog query/submit wire keys (MIG-DESTINATION-GEO). */
export const BWL_CATALOG_GEO_FIELDS = {
  DESTINATION_ID: 'destinationId',
  ON_SITE_ID: 'onSiteId',
} as const;

export type ActivityModeWire = 'hosted';

/** Activity document person fields (BWL). UPL label: Host. */
export const BWL_ACTIVITY_PERSON_FIELDS = {
  HOST_ID: 'host_id',
  CREATED_BY_ID: 'created_by_id',
} as const;

/**
 * Join request messages (BWL). JSON camelCase — not snake `host_note`.
 * - `note` — joiner → host
 * - `hostNote` — host decision / revoke message
 */
export const BWL_JOIN_REQUEST_FIELDS = {
  NOTE: 'note',
  HOST_NOTE: 'hostNote',
} as const;

export const resolveHostNote = (input: {
  hostNote?: string | null;
} | null | undefined): string | null => {
  const raw = input?.hostNote ?? null;
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/** HTTP mount prefixes (canonical). */
/** Consumer SPA route prefix — tenant HTTP remains {@link BWL_API_MOUNTS.PUBLISHING_WORKSPACE}. */
export const BWL_SPA_ROUTES = {
  OPERATOR_CONSOLE_PREFIX: '/operator',
} as const;

export const BWL_API_MOUNTS = {
  PUBLISHING_WORKSPACE: '/publishing',
  MEMBER_DISCOVERY: '/me/member-discovery',
  /** Optional target; default keep member-discovery */
  PEOPLE_DISCOVERY_TARGET: '/me/people',
  PLACES: '/places',
  PRO_APPLICATION: '/me/pro-application',
  ADMIN_PRO_APPLICATIONS: '/admin/pro-applications',
  SAFETY_REPORTS: '/safety/reports',
} as const;

/**
 * Explore map item `source` — one lexicon for presentation, person, and plan projection.
 *
 * Canonical emit: activity · place · facility · shop · agency.
 * Area is **not** a pin — admin-curated name; country/state/region come from map geography.
 * Leftover read-only: venue / catalog_place → place; area → drop from map.
 */
export const BWL_EXPLORE_MAP_SOURCE = {
  ACTIVITY: 'activity',
  /** Fixed member availability — activity-shaped map card; storage is member_availability. */
  AVAILABILITY: 'availability',
  PLACE: 'place',
  FACILITY: 'facility',
  SHOP: 'shop',
  AGENCY: 'agency',
  /** Inbound wire — Place pin on Spots (`id` prefix `venue:`). */
  VENUE_INBOUND: 'venue',
  /** Inbound wire — brief COH-02 target; use `place`. */
  CATALOG_PLACE_INBOUND: 'catalog_place',
} as const;

export type ExploreMapSourceCanonical =
  | typeof BWL_EXPLORE_MAP_SOURCE.ACTIVITY
  | typeof BWL_EXPLORE_MAP_SOURCE.AVAILABILITY
  | typeof BWL_EXPLORE_MAP_SOURCE.PLACE
  | typeof BWL_EXPLORE_MAP_SOURCE.FACILITY
  | typeof BWL_EXPLORE_MAP_SOURCE.SHOP
  | typeof BWL_EXPLORE_MAP_SOURCE.AGENCY;

export type ExploreMapSourceWire =
  | ExploreMapSourceCanonical
  | typeof BWL_EXPLORE_MAP_SOURCE.VENUE_INBOUND
  | typeof BWL_EXPLORE_MAP_SOURCE.CATALOG_PLACE_INBOUND;

export const PLACE_MAP_SOURCE = BWL_EXPLORE_MAP_SOURCE.PLACE;
export const FACILITY_MAP_SOURCE = BWL_EXPLORE_MAP_SOURCE.FACILITY;

export const isPlaceMapSource = (source: string | null | undefined): boolean =>
  source === BWL_EXPLORE_MAP_SOURCE.PLACE ||
  source === BWL_EXPLORE_MAP_SOURCE.VENUE_INBOUND ||
  source === BWL_EXPLORE_MAP_SOURCE.CATALOG_PLACE_INBOUND;

export const isFacilityMapSource = (source: string | null | undefined): boolean =>
  source === BWL_EXPLORE_MAP_SOURCE.FACILITY;

/** Place catalog + facility amenity pins (both have coords for map navigation). */
export const isGeographyMapSource = (source: string | null | undefined): boolean =>
  isPlaceMapSource(source) || isFacilityMapSource(source);

export const normalizeExploreMapSource = (source: ExploreMapSourceWire): ExploreMapSourceWire => {
  if (isPlaceMapSource(source)) return BWL_EXPLORE_MAP_SOURCE.PLACE;
  return source;
};

/** Social graph — member-discovery network roster segment. */
export const BWL_PEOPLE_SEGMENT = {
  ALL: 'all',
  FRIENDS_TARGET: 'friends',
  FOLLOWED: 'followed',
} as const;

export type SocialPeopleSegmentCanonical =
  | typeof BWL_PEOPLE_SEGMENT.ALL
  | typeof BWL_PEOPLE_SEGMENT.FRIENDS_TARGET
  | typeof BWL_PEOPLE_SEGMENT.FOLLOWED;

export type SocialPeopleSegmentWire = SocialPeopleSegmentCanonical;

export const isFriendsPeopleSegment = (segment: string | null | undefined): boolean =>
  segment === BWL_PEOPLE_SEGMENT.FRIENDS_TARGET;

export const normalizePeopleSegment = (
  segment: SocialPeopleSegmentWire | string | null | undefined
): SocialPeopleSegmentCanonical => {
  if (isFriendsPeopleSegment(segment)) return BWL_PEOPLE_SEGMENT.FRIENDS_TARGET;
  if (segment === BWL_PEOPLE_SEGMENT.FOLLOWED) return BWL_PEOPLE_SEGMENT.FOLLOWED;
  return BWL_PEOPLE_SEGMENT.ALL;
};

/** RBAC — orthogonal to publish tier and UPL. */
export const BWL_USER_ROLES = [
  'PLATFORM_ADMIN',
  'TENANT_OWNER',
  'TENANT_ADMIN',
  'TENANT_GUIDE',
  'PARTICIPANT',
] as const;
