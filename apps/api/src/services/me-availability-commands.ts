import {
  availabilityMapItemId,
  isFixedAvailabilitySlot,
  type AvailabilityKind,
} from '@uaetrail/shared-types';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';
import { upsertMemberAvailability } from '../lib/member-availability-store.js';
import { notifyMemberOfHostedActivitiesForAvailability } from './availability-hosted-match-notifications.js';
import { notifyMemberPublishSubscribers } from './member-publish-notifications.js';
import { notifyWishlistForMemberAvailability } from './wishlist-alerts.js';

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
  scheduleExploreMapCacheInvalidation('member_availability:upsert');
  void notifyMemberOfHostedActivitiesForAvailability({
    userId,
    availability: data,
  });

  if (data.visibility === 'public') {
    const fixed = [...(data.slots ?? [])].reverse().find(isFixedAvailabilitySlot);
    if (fixed?.slotId) {
      const title = fixed.title?.trim() || 'On the map';
      const mapItemId = availabilityMapItemId(userId, fixed.slotId);
      void notifyMemberPublishSubscribers(userId, {
        publishType: 'availability',
        availabilityMapItemId: mapItemId,
        title,
      });
      void notifyWishlistForMemberAvailability({
        userId,
        availability: data,
        fixedSlot: fixed,
        availabilityMapItemId: mapItemId,
      });
    }
  }

  return data;
};
