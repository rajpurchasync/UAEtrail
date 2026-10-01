import {
  MEMBER_MAP_PIN_ACTIVITY_TYPES,
  type MemberMapPinActivityType,
} from '@uaetrail/shared-types';

const SET = new Set<string>(MEMBER_MAP_PIN_ACTIVITY_TYPES);

export const parseMemberMapPinActivityType = (
  value: string | undefined | null
): MemberMapPinActivityType | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (SET.has(lower)) return lower as MemberMapPinActivityType;
  if (lower === 'hiking') return 'hike';
  if (lower === 'camping') return 'camp';
  if (lower === 'rideshare') return 'trip';
  return null;
};

export const scheduledLocationToPinActivityType = (
  activityType: string | undefined
): MemberMapPinActivityType | null => {
  if (!activityType) return null;
  const t = activityType.toUpperCase();
  if (t === 'HIKING') return 'hike';
  if (t === 'CAMPING') return 'camp';
  if (t === 'EVENT') return 'event';
  if (t === 'RIDESHARE') return 'trip';
  return parseMemberMapPinActivityType(activityType.toLowerCase());
};
