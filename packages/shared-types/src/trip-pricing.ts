export interface TripPricePackage {
  label: string;
  amount: number;
  currency: string;
}
export type TripPricingMode = 'free' | 'shared' | 'paid';
export type TripCurrency = 'AED' | 'USD' | 'EUR' | 'SAR' | 'OMR';

export const TRIP_CURRENCIES: readonly TripCurrency[] = ['AED', 'USD', 'EUR', 'SAR', 'OMR'];

const TRIP_PRICING_MODE_LABELS: Record<TripPricingMode, string> = {
  free: 'Free',
  shared: 'Cost Shared',
  paid: 'Professional Paid trip',
};

export type TripPricingInput = {
  price: number;
  pricePackages?: TripPricePackage[] | null;
  paymentTerms?: string | null;
  pricingMode?: TripPricingMode | null;
};

const isTripCurrency = (value: unknown): value is TripCurrency =>
  typeof value === 'string' && (TRIP_CURRENCIES as readonly string[]).includes(value);

export const isTripPricePackage = (value: unknown): value is TripPricePackage => {
  if (!value || typeof value !== 'object') return false;
  const pkg = value as Record<string, unknown>;
  return (
    typeof pkg.label === 'string' &&
    pkg.label.trim().length > 0 &&
    pkg.label.length <= 120 &&
    typeof pkg.amount === 'number' &&
    Number.isInteger(pkg.amount) &&
    pkg.amount >= 0 &&
    pkg.amount <= 999_999 &&
    isTripCurrency(pkg.currency ?? 'AED')
  );
};

/** Parse stored Mongo/API price packages — lenient read path for legacy docs. */
export const parseStoredPricePackages = (value: unknown): TripPricePackage[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isTripPricePackage)
    .slice(0, 12)
    .map((pkg) => ({
      label: pkg.label.trim(),
      amount: pkg.amount,
      currency: (pkg.currency ?? 'AED') as TripCurrency,
    }));
};

export const derivePriceAed = (packages: TripPricePackage[], fallback = 0): number => {
  if (packages.length === 0) return fallback;
  return Math.min(...packages.map((pkg) => pkg.amount));
};

export const normalizeActivityPricing = (input: {
  price?: number;
  pricePackages?: TripPricePackage[];
  pricingMode?: TripPricingMode;
}): { priceAed: number; pricePackages: TripPricePackage[]; pricingMode: TripPricingMode } => {
  const trimmedPackages = input.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [];
  const pricingMode =
    input.pricingMode ??
    (trimmedPackages.some((pkg) => pkg.amount > 0)
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

export const formatPackagePrice = (pkg: Pick<TripPricePackage, 'amount' | 'currency'>): string => {
  if (pkg.amount === 0) return 'Free';
  return `${pkg.currency} ${pkg.amount.toLocaleString()}`;
};

export const tripHasPaidPricing = (trip: {
  price: number;
  pricePackages?: TripPricePackage[] | null;
}): boolean => {
  const packages = trip.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [];
  return trip.price > 0 || packages.some((pkg) => pkg.amount > 0);
};

export const tripPriceLabel = (trip: {
  price: number;
  pricePackages?: TripPricePackage[] | null;
}): string => {
  const packages = trip.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [];
  if (packages.length > 1) {
    const paid = packages.filter((pkg) => pkg.amount > 0);
    if (paid.length === 0) return 'Free';
    const min = paid.reduce((a, b) => (a.amount <= b.amount ? a : b));
    return `From ${formatPackagePrice(min)}`;
  }
  if (packages.length === 1) return formatPackagePrice(packages[0]);
  const price = trip.price ?? 0;
  if (price === 0) return 'Free';
  return `AED ${price.toLocaleString()}`;
};

export const inferTripPricingMode = (trip: TripPricingInput): TripPricingMode => {
  if (trip.pricingMode === 'free' || trip.pricingMode === 'shared' || trip.pricingMode === 'paid') {
    return trip.pricingMode;
  }

  const packages = trip.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [];
  if (!tripHasPaidPricing({ price: trip.price, pricePackages: packages })) return 'free';

  if (packages.length > 1) return 'paid';

  const terms = trip.paymentTerms?.trim() ?? '';
  if (terms.length > 0 && packages.length <= 1) {
    return 'shared';
  }

  return 'paid';
};

export const tripPricingModeLabel = (trip: TripPricingInput): string =>
  TRIP_PRICING_MODE_LABELS[inferTripPricingMode(trip)];

export const eventHasPaidPricing = (input: {
  price?: number | null;
  pricePackages?: TripPricePackage[] | null;
}): boolean =>
  tripHasPaidPricing({
    price: input.price ?? 0,
    pricePackages: input.pricePackages ?? [],
  });
