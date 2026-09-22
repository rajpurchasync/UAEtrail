import { activityHasPaidPricing, type ActivityPricePackage } from './activity-pricing.js';

/** UI availability badge — derived from slots and pricing, not Mongo activity status. */
export type ActivityAvailabilityStatus = 'free' | 'paid' | 'full';

export type ActivityAvailabilityInput = {
  slotsAvailable: number;
  price: number;
  pricePackages?: ActivityPricePackage[] | null;
};

export const deriveActivityAvailability = (activity: ActivityAvailabilityInput): ActivityAvailabilityStatus => {
  if (activity.slotsAvailable <= 0) return 'full';
  if (activityHasPaidPricing(activity)) return 'paid';
  return 'free';
};

export const isActivityFull = (activity: Pick<ActivityAvailabilityInput, 'slotsAvailable'>): boolean =>
  activity.slotsAvailable <= 0;
