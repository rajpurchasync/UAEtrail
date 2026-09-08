import { z } from 'zod';

const TRIP_CURRENCIES = ['AED', 'USD', 'EUR', 'SAR', 'OMR'] as const;

const tripPricePackageSchema = z.object({
  label: z.string().min(1).max(120),
  amount: z.number().int().min(0).max(999_999),
  currency: z.enum(TRIP_CURRENCIES).default('AED')
});

export type TripPricePackage = z.infer<typeof tripPricePackageSchema>;

export const tripPricePackagesSchema = z.array(tripPricePackageSchema).max(12);

export const parseStoredPricePackages = (value: unknown): TripPricePackage[] => {
  const parsed = tripPricePackagesSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
};

const derivePriceAed = (packages: TripPricePackage[], fallback = 0): number => {
  if (packages.length === 0) return fallback;
  const amounts = packages.map((p) => p.amount);
  return Math.min(...amounts);
};

export const normalizeActivityPricing = (input: {
  price?: number;
  pricePackages?: TripPricePackage[];
  pricingMode?: 'free' | 'shared' | 'paid';
}): { priceAed: number; pricePackages: TripPricePackage[]; pricingMode: 'free' | 'shared' | 'paid' } => {
  const trimmedPackages = input.pricePackages?.filter((p) => p.label.trim()) ?? [];
  const pricingMode =
    input.pricingMode ??
    (trimmedPackages.some((p) => p.amount > 0)
      ? 'paid'
      : (input.price ?? 0) > 0
        ? 'shared'
        : 'free');

  if (pricingMode === 'free') {
    return { priceAed: 0, pricePackages: [], pricingMode: 'free' };
  }

  if (pricingMode === 'shared') {
    return {
      priceAed: Math.max(0, input.price ?? 0),
      pricePackages: [],
      pricingMode: 'shared',
    };
  }

  const pricePackages =
    trimmedPackages.length > 0
      ? trimmedPackages
      : (input.price ?? 0) > 0
        ? [{ label: 'Standard', amount: input.price!, currency: 'AED' as const }]
        : [];

  return {
    pricePackages,
    priceAed: derivePriceAed(pricePackages, input.price ?? 0),
    pricingMode: 'paid',
  };
};
