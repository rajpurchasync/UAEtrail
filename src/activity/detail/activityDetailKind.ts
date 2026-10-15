import type { ActivityDetailDTO, ScheduledActivityType } from '@uaetrail/shared-types';

/**
 * Consumer activity detail template key — one reusable page shell per kind.
 * Route stays `/activity/:id`; template is chosen from listing `activityType`.
 */
export type ActivityDetailKind = 'hiking' | 'camping' | 'rideshare' | 'other';

const SCHEDULED_TO_TEMPLATE: Record<ScheduledActivityType, ActivityDetailKind> = {
  hiking: 'hiking',
  camping: 'camping',
  rideshare: 'rideshare',
  event: 'other',
};

export const resolveActivityDetailKind = (
  activity: Pick<ActivityDetailDTO, 'activityType'>
): ActivityDetailKind => SCHEDULED_TO_TEMPLATE[activity.activityType] ?? 'other';
