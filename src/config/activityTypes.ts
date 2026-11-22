/**
 * Product taxonomy
 * ─────────────────
 * Scheduled activities (map + `/activity/:id`) — wire `ScheduledActivityType` in `@uaetrail/shared-types`:
 *   hiking · camping · event · rideshare
 *
 * Places (trails, camps, shops, …) are a separate catalog — `PlaceActivityType` on `LocationDTO`.
 */

import type { ScheduledActivityType } from '@uaetrail/shared-types';
import { EXPLORE_MAP_PATH } from './platform';
import { PRODUCT_ACTIVITIES_EXPLORE_BLURB } from '../content/productNorthStar';

/** All scheduled listing kinds on the API wire. */
export const SCHEDULED_ACTIVITY_TYPES: readonly ScheduledActivityType[] = [
  'hiking',
  'camping',
  'event',
  'rideshare',
];

/** Host create picker — rideshare is usually offered from Transport / linked flow, not this grid. */
export const ACTIVITY_TYPES = ['hiking', 'camping', 'event'] as const satisfies readonly ScheduledActivityType[];

export type ActivityPickerType = (typeof ACTIVITY_TYPES)[number];

/** Scheduled listing wire kind — re-export for FE modules that predate direct shared-types imports. */
export type ActivityType = ScheduledActivityType;

/** Umbrella product name for scheduled listings (singular). */
export const ACTIVITY_PRODUCT_SINGULAR = 'Activity';

/** Umbrella product name for scheduled listings (plural). */
export const ACTIVITY_PRODUCT_PLURAL = 'Activities';

/** Short summary of scheduled listing kinds — use in blurbs and empty states. */
export const ACTIVITY_KINDS_SUMMARY = 'Hikes, camps, runs, and group outings';

/** Consumer explore blurb under the Activities section. */
export const activitiesExploreBlurb = (): string => PRODUCT_ACTIVITIES_EXPLORE_BLURB;
export const ACTIVITY_TYPE_LABELS: Record<ScheduledActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  event: 'Event',
  rideshare: 'Rideshare',
};

/** Plural labels for browse filters and grouped sections. */
export const ACTIVITY_TYPE_GROUP_LABELS: Record<ScheduledActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  event: 'Events',
  rideshare: 'Rideshare',
};

/** Labels on the add-activity type picker cards. */
export const ACTIVITY_TYPE_PICKER_LABELS: Record<ActivityPickerType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  event: 'Event',
};

/** Short descriptions for the activity-type picker when creating. */
export const ACTIVITY_TYPE_DESCRIPTIONS: Record<ActivityPickerType, string> = {
  hiking: 'Trail outings with meeting points, itinerary, transport, and join requests.',
  camping: 'Overnight or multi-day camping experiences at outdoor venues.',
  event: 'Trail runs, clean-ups, workshops, and other outdoor events with optional external signup.',
};

/** Location catalog labels (not the same as a scheduled activity listing). */
export const LOCATION_TYPE_LABELS: Record<ActivityPickerType, string> = {
  hiking: 'Hiking trail',
  camping: 'Camping location',
  event: 'Event location',
};

/** Normalize API/query aliases to the canonical activity type. */
export const parseActivityTypeParam = (value: string | null | undefined): ScheduledActivityType | null => {
  if (
    value === 'hiking' ||
    value === 'camping' ||
    value === 'event' ||
    value === 'rideshare'
  ) {
    return value;
  }
  if (value === 'community_activity' || value === 'COMMUNITY_ACTIVITY' || value === 'EVENT') return 'event';
  if (value === 'RIDESHARE') return 'rideshare';
  return null;
};

/** Browse filter chips: All + Hiking / Camping / Events. */
export const ACTIVITY_BROWSE_FILTER_OPTIONS: Array<{ key: 'all' | ScheduledActivityType; label: string }> = [
  { key: 'all', label: 'All' },
  ...ACTIVITY_TYPES.map((type) => ({
    key: type,
    label: ACTIVITY_TYPE_GROUP_LABELS[type],
  })),
];

/** Title for host create/edit activity forms. */
export const activityFormTitle = (type: ScheduledActivityType, mode: 'create' | 'edit'): string => {
  if (type === 'event') {
    return mode === 'edit' ? 'Edit Event' : 'New Event';
  }
  if (type === 'rideshare') {
    return mode === 'edit' ? 'Edit Rideshare' : 'New Rideshare';
  }
  const verb = mode === 'edit' ? 'Edit' : 'New';
  return `${verb} ${ACTIVITY_TYPE_LABELS[type]} ${ACTIVITY_PRODUCT_SINGULAR}`;
};

/** Detail page banner eyebrow for a scheduled listing. */
export const activityDetailEyebrow = (type: ScheduledActivityType): string =>
  ACTIVITY_TYPE_LABELS[type] ?? 'Activity';

/** Banner eyebrow when `activityMode` is on the wire (retired seeking posts use archive label). */
export const activityDetailEyebrowForActivity = (
  type: ScheduledActivityType,
  activityMode?: 'hosted' | 'seeking' | null
): string => {
  if (activityMode === 'seeking') return 'Archived find post';
  return activityDetailEyebrow(type);
};

/** Empty-state copy when filtering Activities by kind. */
export const noScheduledActivitiesMessage = (type: ScheduledActivityType): string => {
  if (type === 'event') return 'No events on the calendar right now.';
  if (type === 'rideshare') return 'No rideshare offers on the calendar right now.';
  return `No ${ACTIVITY_TYPE_GROUP_LABELS[type].toLowerCase()} activities on the calendar right now.`;
};

/** Link label for browsing all of one activity kind. */
export const browseAllActivitiesOfTypeLabel = (type: ScheduledActivityType): string => {
  if (type === 'event') return 'Browse all events';
  if (type === 'rideshare') return 'Browse all rideshare offers';
  return `Browse all ${ACTIVITY_TYPE_GROUP_LABELS[type].toLowerCase()} activities`;
};

/** Public browse page for scheduled activities, optionally filtered by type. */
export const activitiesBrowsePath = (activityType?: ScheduledActivityType | null): string => {
  if (!activityType) return EXPLORE_MAP_PATH;
  const params = new URLSearchParams({ activity: activityType });
  return `${EXPLORE_MAP_PATH}?${params.toString()}`;
};

