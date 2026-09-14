import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  derivePriceAed,
  formatPackagePrice,
  inferActivityPricingMode,
  activityHasPaidPricing,
  activityPriceLabel,
  activityPricingModeLabel,
  type ActivityPricePackage,
  type ActivityPricingMode,
} from '@uaetrail/shared-types';

export type { ActivityPricePackage, ActivityPricingMode };

export { derivePriceAed, formatPackagePrice };

type ActivityPricingInput = Pick<ActivityDTO, 'price' | 'pricePackages' | 'paymentTerms' | 'pricingMode'>;

/** Tailwind badge styling — labels/modes from shared-types. */
export const activityPricingBadge = (
  activity: ActivityPricingInput
): { bg: string; text: string; label: string } => {
  const mode = inferActivityPricingMode(activity);
  const amount = activityPriceLabel(activity);

  if (mode === 'free') {
    return { bg: 'bg-emerald-500/15', text: 'text-emerald-700', label: activityPricingModeLabel(activity) };
  }
  if (mode === 'shared') {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-800',
      label:
        (activity.price ?? 0) > 0
          ? `${activityPricingModeLabel(activity)} · ${amount}`
          : activityPricingModeLabel(activity),
    };
  }
  return {
    bg: 'bg-blue-500/15',
    text: 'text-blue-700',
    label: amount !== 'Free' ? `${activityPricingModeLabel(activity)} · ${amount}` : activityPricingModeLabel(activity),
  };
};

export {
  inferActivityPricingMode,
  activityHasPaidPricing,
  activityPriceLabel,
  activityPricingModeLabel,
};
