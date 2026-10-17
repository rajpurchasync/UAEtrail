import type { AvailabilityKind } from '@uaetrail/shared-types';
import { upsertMemberAvailability } from '../lib/member-availability-store.js';
import { notifyMemberOfHostedActivitiesForAvailability } from './availability-hosted-match-notifications.js';

export type UpsertMyMemberAvailabilityInput = {
  kinds: AvailabilityKind[];
  visibility: 'public' | 'buddies' | 'hidden';
  region?: string | null;
  areaId?: string | null;
  note?: string | null;
  slots: Array<{
    startDate: string;
    endDate: string;
    timeBand?: 'morning' | 'afternoon' | 'evening' | 'any' | null;
  }>;
};

export const upsertMyMemberAvailability = async (
  userId: string,
  input: UpsertMyMemberAvailabilityInput
) => {
  const data = await upsertMemberAvailability(userId, input);
  void notifyMemberOfHostedActivitiesForAvailability({
    userId,
    availability: data,
  });
  return data;
};
