/** MongoDB collection names for scheduled activities and engagement. */
export const COLLECTIONS = {
  ACTIVITIES: 'activities',
  ACTIVITY_REQUESTS: 'activity_requests',
  ACTIVITY_PARTICIPANTS: 'activity_participants',
} as const;

/** Legacy collection names migrated on startup. */
export const LEGACY_COLLECTIONS = {
  EVENTS: 'events',
  EVENT_REQUESTS: 'event_requests',
  EVENT_PARTICIPANTS: 'event_participants',
} as const;
