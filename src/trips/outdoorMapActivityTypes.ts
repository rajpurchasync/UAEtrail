import type { MemberMapPinActivityType } from '@uaetrail/shared-types';
import { MEMBER_MAP_PIN_ACTIVITY_TYPES } from '@uaetrail/shared-types';

export type OutdoorActivityOption = {
  id: MemberMapPinActivityType;
  label: string;
  emoji: string;
};

export const OUTDOOR_MAP_ACTIVITY_OPTIONS: OutdoorActivityOption[] = [
  { id: 'hike', label: 'Hike', emoji: '🥾' },
  { id: 'camp', label: 'Camp', emoji: '🏕️' },
  { id: 'trek', label: 'Trek', emoji: '⛰️' },
  { id: 'trail_run', label: 'Trail run', emoji: '🏃' },
  { id: 'climb', label: 'Climb', emoji: '🧗' },
  { id: 'event', label: 'Event', emoji: '🎪' },
  { id: 'trip', label: 'Trip', emoji: '✈️' },
  { id: 'other', label: 'Other', emoji: '📍' },
];

const optionById = new Map(OUTDOOR_MAP_ACTIVITY_OPTIONS.map((o) => [o.id, o]));

/** Map legacy API strings (e.g. hiking) to canonical pin types. */
export const normalizeOutdoorActivityType = (raw: string | null | undefined): MemberMapPinActivityType => {
  if (!raw) return 'other';
  const lower = raw.toLowerCase();
  if ((MEMBER_MAP_PIN_ACTIVITY_TYPES as readonly string[]).includes(lower)) {
    return lower as MemberMapPinActivityType;
  }
  if (lower === 'hiking') return 'hike';
  if (lower === 'camping') return 'camp';
  if (lower === 'rideshare') return 'trip';
  return 'other';
};

export const outdoorActivityLabel = (raw: string | null | undefined): string => {
  const id = normalizeOutdoorActivityType(raw);
  return optionById.get(id)?.label ?? 'Outdoor';
};

export const outdoorActivityEmoji = (raw: string | null | undefined, kind: 'wishlist' | 'visited'): string => {
  if (kind === 'wishlist') return '⭐';
  const id = normalizeOutdoorActivityType(raw);
  return optionById.get(id)?.emoji ?? '📍';
};
