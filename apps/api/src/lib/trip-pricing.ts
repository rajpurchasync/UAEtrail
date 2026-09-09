import { z } from 'zod';
import { parseStoredPricePackages, type TripPricePackage } from '@uaetrail/shared-types';

export {
  derivePriceAed,
  eventHasPaidPricing,
  formatPackagePrice,
  inferTripPricingMode,
  normalizeActivityPricing,
  parseStoredPricePackages,
  tripHasPaidPricing,
  tripPriceLabel,
  tripPricingModeLabel,
  type TripCurrency,
  type TripPricePackage,
  type TripPricingInput,
  type TripPricingMode,
} from '@uaetrail/shared-types';

const tripPricePackageSchema = z.object({
  label: z.string().min(1).max(120),
  amount: z.number().int().min(0).max(999_999),
  currency: z.enum(['AED', 'USD', 'EUR', 'SAR', 'OMR']).default('AED'),
});

export const tripPricePackagesSchema = z.array(tripPricePackageSchema).max(12);

/** Strict Zod parse for host write APIs — falls back to shared read parser shape. */
export const parseValidatedPricePackages = (value: unknown): TripPricePackage[] => {
  const parsed = tripPricePackagesSchema.safeParse(value);
  return parsed.success ? parsed.data : parseStoredPricePackages(value);
};
