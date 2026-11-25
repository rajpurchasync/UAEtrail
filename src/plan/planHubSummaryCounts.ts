import type {
  ActivityDTO,
  MemberAvailabilitySlotDTO,
  MemberGoalDTO,
  MyActivityDTO,
  WishlistItemDTO,
} from '@uaetrail/shared-types';
import { isFixedAvailabilitySlot, isRetiredSeekingActivityModeValue } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { buildUpcomingPlanRows } from '../utils/activityHubSections';
import { aggregateMemberGoals } from '../utils/memberGoalsAggregate';

const todayStart = () => new Date(new Date().toDateString());

/** Upcoming hosted outings + upcoming fixed availability on the map. */
export const countHostingUpcomingCommitments = (
  activities: ActivityDTO[],
  _pendingRequests: ActivityRequestView[],
  availabilitySlots: MemberAvailabilitySlotDTO[]
): number => {
  const today = todayStart();
  let count = 0;
  for (const event of activities) {
    if (event.status !== 'published') continue;
    if (isRetiredSeekingActivityModeValue(event.activityMode)) continue;
    if (new Date(event.date) < today) continue;
    count += 1;
  }
  for (const slot of availabilitySlots) {
    if (!isFixedAvailabilitySlot(slot)) continue;
    const day = slot.startDate?.slice(0, 10);
    if (!day) continue;
    if (new Date(day) < today) continue;
    count += 1;
  }
  return count;
};

/** Confirmed + pending join requests on upcoming outings. */
export const countPlanJoinedUpcoming = (
  activities: MyActivityDTO[],
  requests: ActivityRequestView[]
): number => buildUpcomingPlanRows(activities, requests).length;

export const countPlanActiveGoals = (goals: MemberGoalDTO[]): number =>
  aggregateMemberGoals(goals).activeGoals.length;

/** Catalog venue rows on Plan Want to go (`locationId` only). */
export const isPlanWantToGoVenue = (item: WishlistItemDTO): boolean => Boolean(item.locationId);

export const countPlanSavedPlaces = (items: WishlistItemDTO[]): number =>
  items.filter(isPlanWantToGoVenue).length;