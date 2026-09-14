import { z } from 'zod';
import { parseStoredPricePackages, type ActivityPricePackage } from '@uaetrail/shared-types';

export {
  derivePriceAed,
  eventHasPaidPricing,
  formatPackagePrice,
  inferActivityPricingMode,
  normalizeActivityPricing,
  parseStoredPricePackages,
  activityHasPaidPricing,
  activityPriceLabel,
  activityPricingModeLabel,
  type ActivityCurrency,
  type ActivityPricePackage,
  type ActivityPricingInput,
  type ActivityPricingMode,
} from '@uaetrail/shared-types';

const activityPricePackageSchema = z.object({
  label: z.string().min(1).max(120),
  amount: z.number().int().min(0).max(999_999),
  currency: z.enum(['AED', 'USD', 'EUR', 'SAR', 'OMR']).default('AED'),
});

export const activityPricePackagesSchema = z.array(activityPricePackageSchema).max(12);

/** Strict Zod parse for host write APIs — falls back to shared read parser shape. */
export const parseValidatedPricePackages = (value: unknown): ActivityPricePackage[] => {
  const parsed = activityPricePackagesSchema.safeParse(value);
  return parsed.success ? parsed.data : parseStoredPricePackages(value);
};
