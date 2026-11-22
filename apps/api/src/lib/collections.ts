/** MongoDB collection names — single source of truth. */
export const COLLECTIONS = {
  // Auth & users
  AUTH_USERS: 'auth_users',
  AUTH_REFRESH_TOKENS: 'auth_refresh_tokens',
  AUTH_EMAIL_VERIFICATION_TOKENS: 'auth_email_verification_tokens',
  AUTH_EMAIL_CHANGE_TOKENS: 'auth_email_change_tokens',
  AUTH_PASSWORD_RESET_TOKENS: 'auth_password_reset_tokens',
  /** Retired — migrated to AUTH_USERS on startup if present. */
  USERS: 'users',

  // Organisations
  TENANTS: 'tenants',
  TENANT_MEMBERSHIPS: 'tenant_memberships',
  /** Target: `pro_applications` (MIG-COH-03). Collection name optional same-phase rename. */
  HOST_APPLICATIONS: 'host_applications',

  // Places & premium unlocks
  LOCATIONS: 'locations',
  /** Trail polyline, elevation profile, GPX key — `_id` = location id (plan §13.5). */
  PLACE_TRACKS: 'place_tracks',
  /** Pro-gated guide markdown — `_id` = location id. */
  PLACE_GUIDES: 'place_guides',
  /** Amenity POIs (toilet, parking, outdoor_shop, …) — Program CPC. */
  FACILITIES: 'facilities',
  /** Platform-wide safety / ops banners for public detail surfaces. */
  PLATFORM_ALERTS: 'platform_alerts',
  /** Fire-and-forget partner / referral outbound clicks (commercial facilities). */
  REFERRAL_CLICKS: 'referral_clicks',
  LOCATION_UNLOCKS: 'location_unlocks',
  AREAS: 'areas',
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

  // Activities & engagement
  ACTIVITIES: 'activities',
  ACTIVITY_REQUESTS: 'activity_requests',
  ACTIVITY_PARTICIPANTS: 'activity_participants',
  /** Exact meeting pin, emergency contact — `_id` = activity id (plan §13.4). */
  ACTIVITY_PRIVATE: 'activity_private',
  PARTICIPANT_INTENTS: 'participant_intents',
  PARTICIPANT_INTENT_REQUESTS: 'participant_intent_requests',

  // Commerce (merchant storefront profiles only — product catalog removed)
  MERCHANT_PROFILES: 'merchant_profiles',
  STRIPE_WEBHOOK_EVENTS: 'stripe_webhook_events',

  // Social graph (reviews, chat, groups, buddies)
  CHAT_MESSAGES: 'chat_messages',
  CHAT_MESSAGE_REACTIONS: 'chat_message_reactions',
  CONTENT_REPORTS: 'content_reports',
  SOCIAL_REVIEWS: 'social_reviews',
  /** Private teams + activity crew threads (renamed from `social_groups`). */
  MEMBER_GROUPS: 'member_groups',
  /** Discoverable clubs (`MIG-COMMUNITY-DISCOVER`) — not `member_groups`. */
  COMMUNITY_GROUPS: 'community_groups',
  COMMUNITY_GROUP_MEMBERS: 'community_group_members',
  COMMUNITY_GROUP_INVITES: 'community_group_invites',
  COMMUNITY_GROUP_ADMINS: 'community_group_admins',
  MEMBER_GROUP_MEMBERS: 'member_group_members',
  MEMBER_GROUP_INVITES: 'member_group_invites',
  MEMBER_GROUP_WALL: 'member_group_wall',
  MEMBER_GROUP_WALL_REACTIONS: 'member_group_wall_reactions',
  /** @deprecated Pre-split collection names — migrated on startup. */
  LEGACY_SOCIAL_GROUPS: 'social_groups',
  LEGACY_SOCIAL_GROUP_MEMBERS: 'social_group_members',
  LEGACY_SOCIAL_GROUP_INVITES: 'social_group_invites',
  LEGACY_SOCIAL_GROUP_WALL: 'social_group_wall',
  LEGACY_SOCIAL_GROUP_WALL_REACTIONS: 'social_group_wall_reactions',
  /** Adult family members invited onto a specific outing join request. */
  ACTIVITY_FAMILY_INVITES: 'activity_family_invites',
  BUDDY_REQUESTS: 'buddy_requests',
  BUDDY_PAIRS: 'buddy_pairs',
  USER_FOLLOWS: 'user_follows',
  ENTITY_FOLLOWS: 'entity_follows',

  // User data
  USER_WISHLIST: 'user_wishlist',
  /** Cached third-party weather payloads — `_id` = `lat|lng|date` (plan §13.6). */
  WEATHER_CACHE: 'weather_cache',
  NOTIFICATIONS: 'notifications',
  /** Durable async work queue (MIG-OUTBOX); default path remains fire-and-forget until flag on. */
  SIDE_EFFECT_OUTBOX: 'side_effect_outbox',
  REWARD_LEDGERS: 'reward_ledgers',
  USER_BADGES: 'user_badges',
  USER_GOALS: 'user_goals',
  MEMBER_AVAILABILITY: 'member_availability',
  MEMBER_MAP_PINS: 'member_map_pins',
  MEMBER_VEHICLES: 'member_vehicles',
  MEMBER_PROFILE_VIEWS: 'member_profile_views',
  ACTIVITY_INVITES: 'activity_invites',
  PUSH_SUBSCRIPTIONS: 'push_subscriptions',

  // Platform
  MEDIA_ASSETS: 'media_assets',
  AUDIT_LOGS: 'audit_logs',
  /** Batched web-vitals RUM — one document per flush, never per sample. */
  WEB_VITALS_BATCHES: 'web_vitals_batches',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
