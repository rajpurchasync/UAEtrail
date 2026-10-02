import type { MemberJourneyMapDTO, MemberMapPinActivityType } from '@uaetrail/shared-types';
import { MEMBER_MAP_PIN_ACTIVITY_TYPES } from '@uaetrail/shared-types';
import { parseMemberMapPinActivityType } from '../lib/member-map-pin-activity-type.js';
import { listMemberMapPinsForUser, syncActivityCheckInPinsForUser } from '../lib/member-map-pins-store.js';
import { buildJourneyMapEntries } from './member-outdoor-map-entries.js';

const emptyByType = (): Partial<Record<MemberMapPinActivityType, number>> => {
  const out: Partial<Record<MemberMapPinActivityType, number>> = {};
  for (const t of MEMBER_MAP_PIN_ACTIVITY_TYPES) out[t] = 0;
  return out;
};

export const buildMemberJourneyMap = async (userId: string): Promise<MemberJourneyMapDTO> => {
  await syncActivityCheckInPinsForUser(userId);
  const pins = await listMemberMapPinsForUser(userId);

  let wishlistCount = 0;
  let visitedCount = 0;
  let activityCheckInCount = 0;
  const byActivityType = emptyByType();

  for (const pin of pins) {
    if (pin.kind === 'wishlist') wishlistCount += 1;
    if (pin.kind === 'visited') visitedCount += 1;
    if (pin.source === 'activity_check_in') activityCheckInCount += 1;
    const type = parseMemberMapPinActivityType(pin.activityType) ?? 'other';
    byActivityType[type] = (byActivityType[type] ?? 0) + 1;
  }

  const entries = await buildJourneyMapEntries(userId, pins);

  return {
    pins,
    entries,
    stats: {
      totalPins: pins.length,
      wishlistCount,
      visitedCount,
      activityCheckInCount,
      byActivityType,
    },
  };
};
