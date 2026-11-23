import {
  availabilityMapItemId,
  isFixedAvailabilitySlot,
  normalizeAvailabilityVisibility,
  validateMemberAvailabilityWrite,
  type AvailabilityKind,
  type AvailabilityVisibility,
  type MemberAvailabilitySlotDTO,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';
import { upsertMemberAvailability } from '../lib/member-availability-store.js';
import { notifyMemberOfHostedActivitiesForAvailability } from './availability-hosted-match-notifications.js';
import { notifyMemberPublishSubscribers } from './member-publish-notifications.js';
import { resolveMemberStatus } from './member-status.js';
import { notifyWishlistForMemberAvailability } from './wishlist-alerts.js';

export type UpsertMyMemberAvailabilityInput = {
  kinds?: AvailabilityKind[];
  visibility: AvailabilityVisibility | 'buddies';
  region?: string | null;
  areaId?: string | null;
  note?: string | null;
  slots: MemberAvailabilitySlotDTO[];
};

export const upsertMyMemberAvailability = async (
  userId: string,
  input: UpsertMyMemberAvailabilityInput
) => {
  const visibility = normalizeAvailabilityVisibility(input.visibility);
  const status = await resolveMemberStatus(userId);
  const validation = validateMemberAvailabilityWrite({
    slots: input.slots,
    visibility,
    guideProfileComplete: status.guideProfileComplete,
    canHostPaidActivities: status.canHostPaidActivities,
  });
  if (validation) {
    throw new ApiError(400, validation.code, validation.message);
  }

  const data = await upsertMemberAvailability(userId, {
    ...input,
    visibility,
  });
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