import type { PlanCalendarDayDetail } from './planCalendarMarkers';

export type PlanCalendarRowOpenAction =
  | { type: 'none' }
  | { type: 'indicator' }
  | { type: 'joined_peek'; activityId: string }
  | { type: 'navigate'; href: string };

/** How a calendar day row drills from projection → outing or Plan list/manage. */
export const resolvePlanCalendarRowOpenAction = (
  row: PlanCalendarDayDetail
): PlanCalendarRowOpenAction => {
  if (row.kind === 'available') return { type: 'indicator' };
  if (row.kind === 'joined' || row.kind === 'requested') {
    return { type: 'joined_peek', activityId: row.activityId };
  }
  if (row.kind === 'hosting' || row.kind === 'seeking') {
    return { type: 'navigate', href: row.href };
  }
  return { type: 'none' };
};
