import { TenantType } from './enums.js';
import { ApiError } from '../lib/api-error.js';

export type ActivityPricingMode = 'free' | 'shared' | 'paid';

export const assertActivityPricingAllowed = (
  tenantType: TenantType,
  pricingMode: ActivityPricingMode | undefined,
  pricing: { priceAed: number; pricePackages: { amount: number }[] }
): void => {
  const mode =
    pricingMode ??
    (pricing.pricePackages.length > 0
      ? 'paid'
      : pricing.priceAed > 0
        ? 'shared'
        : 'free');

  if (mode === 'paid' && tenantType !== TenantType.COMPANY) {
    throw new ApiError(
      400,
      'paid_pricing_not_allowed',
      'Professional paid activities are only available for business host profiles.'
    );
  }
};
