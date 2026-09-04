import type { ActivityDTO } from '@uaetrail/shared-types';
import { ACTIVITY_TYPE_LABELS, type ActivityType } from '../config/activityTypes';

export const formatActivityType = (activityType: ActivityType | string): string =>
  ACTIVITY_TYPE_LABELS[activityType as ActivityType] ?? String(activityType).replace(/_/g, ' ');

export const activityTypeBadgeClass = (activityType: ActivityType | string): string => {
  if (activityType === 'hiking') return 'bg-emerald-50 text-emerald-700';
  if (activityType === 'community_activity') return 'bg-violet-50 text-violet-700';
  return 'bg-amber-50 text-amber-700';
};

export const resolveActivityOwnerLabel = (
  activity: Pick<ActivityDTO, 'createdByName' | 'hostName' | 'organizerName'>
): string => activity.createdByName ?? activity.hostName ?? activity.organizerName ?? '—';

/** Person hosting the activity (guide/owner on the ground — not tenant brand). */
export const resolveActivityHostLabel = (
  activity: Pick<ActivityDTO, 'hostName' | 'organizerName' | 'createdByName'>
): string =>
  activity.hostName?.trim() ||
  activity.organizerName?.trim() ||
  activity.createdByName?.trim() ||
  '—';

/** Emirate / region for list tables (state only — not venue name). */
export const resolveActivityLocationState = (
  activity: Pick<ActivityDTO, 'region'>
): string => activity.region?.trim() || '—';

export const resolveActivityTitle = (
  activity: Pick<ActivityDTO, 'title' | 'locationName'>
): string => activity.title?.trim() || activity.locationName?.trim() || '—';

export const formatActivityCapacity = (
  activity: Pick<ActivityDTO, 'slotsTotal' | 'slotsAvailable'>
): string => {
  const booked = Math.max(0, activity.slotsTotal - activity.slotsAvailable);
  return `${booked}/${activity.slotsTotal}`;
};

export const formatActivityPrice = (activity: Pick<ActivityDTO, 'price'>): string =>
  activity.price > 0 ? `AED ${activity.price}` : 'Free';