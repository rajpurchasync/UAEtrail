export const ACTIVITY_TYPES = ['hiking', 'camping', 'community_activity'] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  community_activity: 'Community Activity',
};

/** Labels on the add-activity type picker cards. */
export const ACTIVITY_TYPE_PICKER_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking Trip',
  camping: 'Camping',
  community_activity: 'Community Activity',
};

/** Consumer-facing activity group labels (browse / filter). */
export const ACTIVITY_TYPE_GROUP_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  community_activity: 'Community Activities',
};

/** Short descriptions for the activity-type picker when creating. */
export const ACTIVITY_TYPE_DESCRIPTIONS: Record<ActivityType, string> = {
  hiking: 'Trail outings with meeting points, itinerary, transport, and join requests.',
  camping: 'Overnight or multi-day camping experiences at outdoor venues.',
  community_activity: 'Trail runs, mountain clean-ups, workshops, and other outdoor community gatherings.',
};

export const parseActivityTypeParam = (value: string | null | undefined): ActivityType | null => {
  if (value === 'hiking' || value === 'camping' || value === 'community_activity') return value;
  return null;
};

/** Public browse page for scheduled activities, optionally filtered by type. */
export const activitiesBrowsePath = (activityType?: ActivityType | null): string =>
  activityType ? `/activities?activity=${activityType}` : '/activities';

export const locationPathForActivity = (activityType: ActivityType, id: string): string => {
  if (activityType === 'camping') return `/camp/${id}`;
  if (activityType === 'community_activity') return `/community-activity/${id}`;
  return `/trail/${id}`;
};
