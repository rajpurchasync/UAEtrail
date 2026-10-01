/** Outdoor activity label on a personal map pin (global, member-owned). */

export const MEMBER_MAP_PIN_ACTIVITY_TYPES = [
  'hike',
  'camp',
  'trek',
  'trail_run',
  'climb',
  'event',
  'trip',
  'other',
] as const;

export type MemberMapPinActivityType = (typeof MEMBER_MAP_PIN_ACTIVITY_TYPES)[number];
