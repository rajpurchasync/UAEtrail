export const ACTIVITY_TYPES = ['hiking', 'camping', 'community_event'] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  community_event: 'Community Event',
};

export const locationPathForActivity = (activityType: ActivityType, id: string): string => {
  if (activityType === 'camping') return `/camp/${id}`;
  if (activityType === 'community_event') return `/community-event/${id}`;
  return `/trail/${id}`;
};
