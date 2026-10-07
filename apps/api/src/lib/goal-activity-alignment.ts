import type { MemberGoalActivityFilter, MemberMapPinActivityType } from '@uaetrail/shared-types';
import { parseMemberMapPinActivityType } from './member-map-pin-activity-type.js';
import { ActivityType } from '../domain/enums.js';

const HIKING_PIN_TYPES = new Set<MemberMapPinActivityType>(['hike', 'trek', 'trail_run', 'climb']);
const CAMPING_PIN_TYPES = new Set<MemberMapPinActivityType>(['camp']);

/** Whether a personal map pin activity label counts toward the member's goal filter (join / log progress). */
export const mapPinActivityTypeCountsForGoal = (
  raw: string | null | undefined,
  filter: MemberGoalActivityFilter
): boolean => {
  const pinType = parseMemberMapPinActivityType(raw) ?? 'other';
  if (filter === 'hiking') return HIKING_PIN_TYPES.has(pinType);
  if (filter === 'camping') return CAMPING_PIN_TYPES.has(pinType);
  return true;
};

/** Whether a scheduled activity/location type counts toward the goal filter (host progress). */
export const activityTypeCountsForGoal = (
  activityType: string | null | undefined,
  filter: MemberGoalActivityFilter
): boolean => {
  if (!activityType) return false;
  const normalized = activityType.toUpperCase();
  if (filter === 'hiking') return normalized === ActivityType.HIKING;
  if (filter === 'camping') return normalized === ActivityType.CAMPING;
  return (
    normalized === ActivityType.HIKING ||
    normalized === ActivityType.CAMPING ||
    normalized === ActivityType.EVENT ||
    normalized === ActivityType.RIDESHARE
  );
};
