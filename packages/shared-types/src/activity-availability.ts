import { activityHasPaidPricing } from './activity-pricing.js';

/** UI availability badge — derived from slots and pricing, not Mongo activity status. */
export type ActivityAvailabilityStatus = 'free' | 'paid' | 'full';

export type ActivityAvailabilityInput = {
  slotsAvailable: number;
  price: number;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
};

export const deriveActivityAvailability = (activity: ActivityAvailabilityInput): ActivityAvailabilityStatus => {
  if (activity.slotsAvailable <= 0) return 'full';
  if (activityHasPaidPricing(activity)) return 'paid';
  return 'free';
};

export const isActivityFull = (activity: Pick<ActivityAvailabilityInput, 'slotsAvailable'>): boolean =>
  activity.slotsAvailable <= 0;

export type ActivityJoinCapacityInput = {
  slotsTotal?: number | null;
  slotsAvailable?: number | null;
};

/** Join CTA "full" — capped capacity with no open spots (not unknown / unlimited capacity). */
export const activityJoinIsFull = (input: ActivityJoinCapacityInput): boolean => {
  const total = input.slotsTotal ?? 0;
  if (total <= 0) return false;
  const available = input.slotsAvailable;
  if (available == null) return false;
  return available <= 0;
};

export type ActivityJoinCountInput = {
  slotsAvailable?: number | null;
  slotsTotal?: number | null;
  participantPreviews?: readonly unknown[] | null;
};

/** Confirmed/waitlisted joiners excluding the host — used for host check-in affordances. */
export const activityHasJoinedParticipants = (activity: ActivityJoinCountInput | null | undefined): boolean => {
  if (!activity) return false;
  if (activity.slotsTotal != null && activity.slotsAvailable != null) {
    return activity.slotsAvailable < activity.slotsTotal;
  }
  return (activity.participantPreviews?.length ?? 0) > 0;
};
