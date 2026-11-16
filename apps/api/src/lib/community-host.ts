import { countPublishedActivitiesHostedByUser } from './activity-engagement-store.js';
import { countActiveFixedAvailabilityMapSlotsForUser } from './member-availability-store.js';

/** Published hosted outings or fixed crew-availability pins on the map. */
export const isCommunityHostByUserId = async (userId: string): Promise<boolean> => {
  const [hosted, fixedMapSlots] = await Promise.all([
    countPublishedActivitiesHostedByUser(userId),
    countActiveFixedAvailabilityMapSlotsForUser(userId),
  ]);
  return hosted > 0 || fixedMapSlots > 0;
};