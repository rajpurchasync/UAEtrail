/** MongoDB collection names — single source of truth. */
export const COLLECTIONS = {
  // Auth & users
  AUTH_USERS: 'auth_users',
  AUTH_REFRESH_TOKENS: 'auth_refresh_tokens',
  AUTH_EMAIL_VERIFICATION_TOKENS: 'auth_email_verification_tokens',
  AUTH_EMAIL_CHANGE_TOKENS: 'auth_email_change_tokens',
  AUTH_PASSWORD_RESET_TOKENS: 'auth_password_reset_tokens',
  /** Legacy — migrated to AUTH_USERS on startup if present. */
  USERS: 'users',

  // Organisations
  TENANTS: 'tenants',
  TENANT_MEMBERSHIPS: 'tenant_memberships',
  HOST_APPLICATIONS: 'host_applications',

  // Places & premium unlocks
  LOCATIONS: 'locations',
  LOCATION_UNLOCKS: 'location_unlocks',

  // Activities & engagement
  ACTIVITIES: 'activities',
  ACTIVITY_REQUESTS: 'activity_requests',
  ACTIVITY_PARTICIPANTS: 'activity_participants',
  PARTICIPANT_INTENTS: 'participant_intents',
  PARTICIPANT_INTENT_REQUESTS: 'participant_intent_requests',

  // Commerce
  MERCHANT_PROFILES: 'merchant_profiles',
  PRODUCTS: 'products',
  SHOP_ORDERS: 'shop_orders',
  ORDER_LINE_ITEMS: 'order_line_items',
  PRODUCT_CLICKS: 'product_clicks',
  STRIPE_WEBHOOK_EVENTS: 'stripe_webhook_events',

  // Social & community
  CHAT_MESSAGES: 'chat_messages',
  SOCIAL_REVIEWS: 'social_reviews',
  SOCIAL_POSTS: 'social_posts',
  SOCIAL_POST_REPLIES: 'social_post_replies',
  SOCIAL_POST_REPLY_LIKES: 'social_post_reply_likes',
  SOCIAL_POST_LIKES: 'social_post_likes',
  SOCIAL_GROUPS: 'social_groups',
  SOCIAL_GROUP_MEMBERS: 'social_group_members',
  SOCIAL_GROUP_INVITES: 'social_group_invites',
  SOCIAL_GROUP_WALL: 'social_group_wall',
  SOCIAL_GROUP_WALL_REACTIONS: 'social_group_wall_reactions',
  BUDDY_REQUESTS: 'buddy_requests',
  BUDDY_PAIRS: 'buddy_pairs',
  USER_FOLLOWS: 'user_follows',

  // User data
  USER_FAVORITES: 'user_favorites',
  NOTIFICATIONS: 'notifications',
  REWARD_LEDGERS: 'reward_ledgers',
  USER_BADGES: 'user_badges',
  USER_GOALS: 'user_goals',
  MEMBER_MAP_PINS: 'member_map_pins',
  PUSH_SUBSCRIPTIONS: 'push_subscriptions',

  // Platform
  MEDIA_ASSETS: 'media_assets',
  AUDIT_LOGS: 'audit_logs',
} as const;

/** Legacy collection names migrated on startup. */
export const LEGACY_COLLECTIONS = {
  EVENTS: 'events',
  EVENT_REQUESTS: 'event_requests',
  EVENT_PARTICIPANTS: 'event_participants',
  ORGANIZER_APPLICATIONS: 'organizer_applications',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
