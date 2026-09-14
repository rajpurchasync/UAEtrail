import { TenantType } from './enums.js';
import { ApiError } from '../lib/api-error.js';

export type ActivityPricingMode = 'free' | 'shared' | 'paid';

export const assertActivityPricingAllowed = (input: {
  tenantType: TenantType;
  pricingMode?: ActivityPricingMode;
  pricing: { priceAed: number; pricePackages: { amount: number }[] };
  sharedAmountAed?: number | null;
}): void => {
  const mode =
    input.pricingMode ??
    (input.pricing.pricePackages.length > 0
      ? 'paid'
      : input.pricing.priceAed > 0
        ? 'shared'
        : 'free');

  if (mode === 'paid' && input.tenantType !== TenantType.COMPANY) {
    throw new ApiError(
      400,
      'paid_pricing_not_allowed',
      'Paid activities are only available for business hosts (agency or shop).'
    );
  }

  if (mode === 'shared') {
    const sharedAmount = input.sharedAmountAed ?? input.pricing.priceAed;
    if (sharedAmount <= 0) {
      throw new ApiError(400, 'shared_cost_amount_required', 'Enter the shared cost amount.');
    }
  }
};
