import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  ACTIVITY_PRICING_INDICATION_NOTE,
  activityHasPaidPricing,
  activityPriceLabel,
  activityPricingModeLabel,
  inferActivityPricingMode,
  normalizeActivityPricing,
  type ActivityPricingMode,
} from '@uaetrail/shared-types';

export type { ActivityPricingMode };
export { ACTIVITY_PRICING_INDICATION_NOTE, normalizeActivityPricing };

type ActivityPricingInput = Pick<ActivityDTO, 'price' | 'paymentTerms' | 'pricingMode'>;

export const activityPricingBadge = (activity: ActivityPricingInput) => {
  const mode = inferActivityPricingMode(activity);
  if (mode === 'free') return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
  if (mode === 'shared') return { bg: 'bg-sky-50', text: 'text-sky-800' };
  return { bg: 'bg-violet-50', text: 'text-violet-800' };
};

export {
  activityHasPaidPricing,
  activityPriceLabel,
  activityPricingModeLabel,
  inferActivityPricingMode,
};
