import type { EventDTO } from '@uaetrail/shared-types';
import { ACTIVITY_TYPE_LABELS, type ActivityType } from '../config/activityTypes';

export const formatActivityType = (activityType: ActivityType | string): string =>
  ACTIVITY_TYPE_LABELS[activityType as ActivityType] ?? String(activityType).replace(/_/g, ' ');

export const activityTypeBadgeClass = (activityType: ActivityType | string): string => {
  if (activityType === 'hiking') return 'bg-emerald-50 text-emerald-700';
  if (activityType === 'community_event') return 'bg-violet-50 text-violet-700';
  return 'bg-amber-50 text-amber-700';
};

export const resolveEventOwnerLabel = (
  event: Pick<EventDTO, 'createdByName' | 'hostName' | 'organizerName'>
): string => event.createdByName ?? event.hostName ?? event.organizerName ?? '—';
