/**
 * Product taxonomy
 * ─────────────────
 * Activities (scheduled host listings)
 *   ├── Hiking
 *   ├── Camping
 *   └── Event
 *
 * Venues/locations (trails, camps, event spots) are a separate catalog — see VENUE_TYPE_LABELS.
 */

export const ACTIVITY_TYPES = ['hiking', 'camping', 'event'] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Umbrella product name for scheduled listings (singular). */
export const ACTIVITY_PRODUCT_SINGULAR = 'Activity';

/** Umbrella product name for scheduled listings (plural). */
export const ACTIVITY_PRODUCT_PLURAL = 'Activities';

/** Short summary of the three kinds — use in blurbs and empty states. */
export const ACTIVITY_KINDS_SUMMARY = 'Hiking, Camping, and Events';

/** Singular label for one scheduled listing of a given kind. */
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  event: 'Event',
};

/** Plural labels for browse filters and grouped sections. */
export const ACTIVITY_TYPE_GROUP_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  event: 'Events',
};

/** Labels on the add-activity type picker cards. */
export const ACTIVITY_TYPE_PICKER_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  event: 'Event',
};

/** Short descriptions for the activity-type picker when creating. */
export const ACTIVITY_TYPE_DESCRIPTIONS: Record<ActivityType, string> = {
  hiking: 'Trail outings with meeting points, itinerary, transport, and join requests.',
  camping: 'Overnight or multi-day camping experiences at outdoor venues.',
  event: 'Trail runs, clean-ups, workshops, and other outdoor events with optional external signup.',
};

/** Venue/location catalog labels (not the same as a scheduled activity listing). */
export const VENUE_TYPE_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking trail',
  camping: 'Camping spot',
  event: 'Event spot',
};

/** Normalize API/query aliases to the canonical activity type. */
export const parseActivityTypeParam = (value: string | null | undefined): ActivityType | null => {
  if (value === 'hiking' || value === 'camping' || value === 'event') return value;
  if (value === 'community_activity' || value === 'COMMUNITY_ACTIVITY' || value === 'EVENT') return 'event';
  return null;
};

/** Browse filter chips: All + Hiking / Camping / Events. */
export const ACTIVITY_BROWSE_FILTER_OPTIONS: Array<{ key: 'all' | ActivityType; label: string }> = [
  { key: 'all', label: 'All' },
  ...ACTIVITY_TYPES.map((type) => ({
    key: type,
    label: ACTIVITY_TYPE_GROUP_LABELS[type],
  })),
];

/** Title for host create/edit activity forms. */
export const activityFormTitle = (type: ActivityType, mode: 'create' | 'edit'): string => {
  if (type === 'event') {
    return mode === 'edit' ? 'Edit Event' : 'New Event';
  }
  const verb = mode === 'edit' ? 'Edit' : 'New';
  return `${verb} ${ACTIVITY_TYPE_LABELS[type]} ${ACTIVITY_PRODUCT_SINGULAR}`;
};

/** Consumer explore blurb under the Activities section. */
export const activitiesExploreBlurb = (): string =>
  `Scheduled ${ACTIVITY_PRODUCT_PLURAL.toLowerCase()} you can join — hiking, camping, and events hosted by verified hosts.`;

/** Detail page banner eyebrow for a scheduled listing. */
export const activityDetailEyebrow = (type: ActivityType | 'carpool'): string => {
  if (type === 'carpool') return 'Carpool';
  if (type === 'hiking') return 'Hiking';
  if (type === 'camping') return 'Camping';
  return 'Event';
};

/** Empty-state copy when filtering Activities by kind. */
export const noScheduledActivitiesMessage = (type: ActivityType): string => {
  if (type === 'event') return 'No events on the calendar right now.';
  return `No ${ACTIVITY_TYPE_GROUP_LABELS[type].toLowerCase()} activities on the calendar right now.`;
};

/** Link label for browsing all of one activity kind. */
export const browseAllActivitiesOfTypeLabel = (type: ActivityType): string => {
  if (type === 'event') return 'Browse all events';
  return `Browse all ${ACTIVITY_TYPE_GROUP_LABELS[type].toLowerCase()} activities`;
};

/** Public browse page for scheduled activities, optionally filtered by type. */
export const activitiesBrowsePath = (activityType?: ActivityType | null): string =>
  activityType ? `/activities?activity=${activityType}` : '/activities';

export const locationPathForActivity = (activityType: ActivityType, id: string): string => {
  if (activityType === 'camping') return `/camp/${id}`;
  if (activityType === 'event') return `/event-spot/${id}`;
  return `/trail/${id}`;
};
