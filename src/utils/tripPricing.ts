import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  derivePriceAed,
  formatPackagePrice,
  inferTripPricingMode,
  tripHasPaidPricing,
  tripPriceLabel,
  tripPricingModeLabel,
  type TripPricePackage,
  type TripPricingMode,
} from '@uaetrail/shared-types';

export {
  derivePriceAed,
  formatPackagePrice,
  inferTripPricingMode,
  tripHasPaidPricing,
  tripPriceLabel,
  tripPricingModeLabel,
  type TripPricePackage,
  type TripPricingMode,
};

type TripPricingInput = Pick<ActivityDTO, 'price' | 'pricePackages' | 'paymentTerms' | 'pricingMode'>;

/** Tailwind badge styling stays frontend-specific; labels/modes come from shared-types. */
export const tripPricingBadge = (
  trip: TripPricingInput
): { bg: string; text: string; label: string } => {
  const mode = inferTripPricingMode(trip);
  const amount = tripPriceLabel(trip);

  if (mode === 'free') {
    return { bg: 'bg-emerald-500/15', text: 'text-emerald-700', label: tripPricingModeLabel(trip) };
  }
  if (mode === 'shared') {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-800',
      label: (trip.price ?? 0) > 0 ? `${tripPricingModeLabel(trip)} · ${amount}` : tripPricingModeLabel(trip),
    };
  }
  return {
    bg: 'bg-blue-500/15',
    text: 'text-blue-700',
    label: amount !== 'Free' ? `${tripPricingModeLabel(trip)} · ${amount}` : tripPricingModeLabel(trip),
  };
};
