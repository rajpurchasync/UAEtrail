import type { ActivityPricingMode, HostTierFlags } from '@uaetrail/shared-types';
import { allowedActivityPricingModes } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';

export type { ActivityPricingMode };

export const assertActivityPricingAllowed = (input: {
  hostTiers: HostTierFlags;
  pricingMode?: ActivityPricingMode;
  priceAed: number;
  sharedAmountAed?: number | null;
}): void => {
  const mode = input.pricingMode ?? (input.priceAed > 0 ? 'shared' : 'free');
  const allowed = allowedActivityPricingModes(input.hostTiers);

  if (!allowed.includes(mode)) {
    if (mode === 'paid') {
      throw new ApiError(
        400,
        'paid_pricing_not_allowed',
        'Paid activities require a business host account (agency or shop).'
      );
    }
    if (mode === 'shared') {
      throw new ApiError(
        400,
        'shared_pricing_not_allowed',
        'Shared-cost activities require a Pro guide or business host account.'
      );
    }
    throw new ApiError(400, 'pricing_not_allowed', 'This pricing option is not available for your account.');
  }

  if (mode === 'shared') {
    const sharedAmount = input.sharedAmountAed ?? input.priceAed;
    if (sharedAmount <= 0) {
      throw new ApiError(400, 'shared_cost_amount_required', 'Enter the shared cost amount.');
    }
  }

  if (mode === 'paid' && input.priceAed <= 0) {
    throw new ApiError(400, 'paid_amount_required', 'Enter the indicative price for this paid activity.');
  }
};
