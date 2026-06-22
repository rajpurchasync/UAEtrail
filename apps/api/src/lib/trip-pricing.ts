import { z } from 'zod';

export const TRIP_CURRENCIES = ['AED', 'USD', 'EUR', 'SAR', 'OMR'] as const;
export type TripCurrency = (typeof TRIP_CURRENCIES)[number];

export const tripPricePackageSchema = z.object({
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

export const derivePriceAed = (packages: TripPricePackage[], fallback = 0): number => {
  if (packages.length === 0) return fallback;
  const amounts = packages.map((p) => p.amount);
  return Math.min(...amounts);
};

export const eventHasPaidPricing = (priceAed: number, packages: TripPricePackage[]): boolean =>
  priceAed > 0 || packages.some((p) => p.amount > 0);

export const normalizeEventPricing = (input: {
  price?: number;
  pricePackages?: TripPricePackage[];
}): { priceAed: number; pricePackages: TripPricePackage[] } => {
  const packages =
    input.pricePackages && input.pricePackages.length > 0
      ? input.pricePackages.filter((p) => p.label.trim())
      : input.price !== undefined && input.price > 0
        ? [{ label: 'Standard', amount: input.price, currency: 'AED' as const }]
        : [];

  return {
    pricePackages: packages,
    priceAed: derivePriceAed(packages, input.price ?? 0)
  };
};
