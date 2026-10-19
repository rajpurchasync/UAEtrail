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
  /** Amenity POIs (toilet, parking, outdoor_shop, …) — Program CPC. */
  FACILITIES: 'facilities',
  LOCATION_UNLOCKS: 'location_unlocks',
  AREAS: 'areas',

  // Activities & engagement
  ACTIVITIES: 'activities',
  ACTIVITY_REQUESTS: 'activity_requests',
  ACTIVITY_PARTICIPANTS: 'activity_participants',
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
  SOCIAL_GROUPS: 'social_groups',
  SOCIAL_GROUP_MEMBERS: 'social_group_members',
  SOCIAL_GROUP_INVITES: 'social_group_invites',
  SOCIAL_GROUP_WALL: 'social_group_wall',
  SOCIAL_GROUP_WALL_REACTIONS: 'social_group_wall_reactions',
  BUDDY_REQUESTS: 'buddy_requests',
  BUDDY_PAIRS: 'buddy_pairs',
  USER_FOLLOWS: 'user_follows',
  ENTITY_FOLLOWS: 'entity_follows',

  // User data
  USER_WISHLIST: 'user_wishlist',
  NOTIFICATIONS: 'notifications',
  /** Durable async work queue (MIG-OUTBOX); default path remains fire-and-forget until flag on. */
  SIDE_EFFECT_OUTBOX: 'side_effect_outbox',
  REWARD_LEDGERS: 'reward_ledgers',
  USER_BADGES: 'user_badges',
  USER_GOALS: 'user_goals',
  MEMBER_AVAILABILITY: 'member_availability',
  MEMBER_MAP_PINS: 'member_map_pins',
  MEMBER_PROFILE_VIEWS: 'member_profile_views',
  ACTIVITY_INVITES: 'activity_invites',
  PUSH_SUBSCRIPTIONS: 'push_subscriptions',

  // Platform
  MEDIA_ASSETS: 'media_assets',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
