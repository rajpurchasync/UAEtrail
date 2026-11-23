import { activityDetailPath } from '../config/routingCatalog';
import { planAvailabilityPath } from './planRouting';
import type { PlanCalendarDayDetail } from './planCalendarMarkers';

export type PlanCalendarRowOpenAction =
  | { type: 'none' }
  | { type: 'indicator' }
  | { type: 'navigate'; href: string };

/** How a calendar day row drills from projection → outing or Plan list/manage. */
export const resolvePlanCalendarRowOpenAction = (
  row: PlanCalendarDayDetail
): PlanCalendarRowOpenAction => {
  if (row.kind === 'available') return { type: 'indicator' };
  if (row.kind === 'block') {
    if (row.scheduleKind === 'open') {
      return { type: 'navigate', href: planAvailabilityPath() };
    }
    if (row.href) return { type: 'navigate', href: row.href };
    return { type: 'indicator' };
  }
  if (row.kind === 'joined' || row.kind === 'requested') {
    return { type: 'navigate', href: activityDetailPath(row.activityId) };
  }
  if (row.kind === 'hosting' || row.kind === 'mapSlot') {
    return { type: 'navigate', href: row.href };
  }
  return { type: 'none' };
};
