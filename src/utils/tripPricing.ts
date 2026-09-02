import type { ActivityDTO, ActivityPricePackageDTO } from '@uaetrail/shared-types';

export const TRIP_CURRENCIES = ['AED', 'USD', 'EUR', 'SAR', 'OMR'] as const;
export type TripCurrency = (typeof TRIP_CURRENCIES)[number];

export type TripPricePackage = ActivityPricePackageDTO;
export type TripPricingMode = 'free' | 'shared' | 'paid';

export const TRIP_PRICING_MODE_LABELS: Record<TripPricingMode, string> = {
  free: 'Free',
  shared: 'Cost Shared',
  paid: 'Professional Paid trip',
};

export const emptyPricePackage = (): TripPricePackage => ({
  label: '',
  amount: 0,
  currency: 'AED'
});

export const formatPackagePrice = (pkg: Pick<TripPricePackage, 'amount' | 'currency'>): string => {
  if (pkg.amount === 0) return 'Free';
  return `${pkg.currency} ${pkg.amount.toLocaleString()}`;
};

export const tripHasPaidPricing = (trip: {
  price: number;
  pricePackages?: TripPricePackage[] | null;
}): boolean => {
  const packages = trip.pricePackages?.filter((p) => p.label.trim()) ?? [];
  return trip.price > 0 || packages.some((p) => p.amount > 0);
};

export const tripPriceLabel = (trip: {
  price: number;
  pricePackages?: TripPricePackage[] | null;
}): string => {
  const packages = trip.pricePackages?.filter((p) => p.label.trim()) ?? [];
  if (packages.length > 1) {
    const paid = packages.filter((p) => p.amount > 0);
    if (paid.length === 0) return 'Free';
    const min = paid.reduce((a, b) => (a.amount <= b.amount ? a : b));
    return `From ${formatPackagePrice(min)}`;
  }
  if (packages.length === 1) return formatPackagePrice(packages[0]);
  const price = trip.price ?? 0;
  if (price === 0) return 'Free';
  return `AED ${price.toLocaleString()}`;
};

export const derivePriceAed = (packages: TripPricePackage[], fallback = 0): number => {
  if (packages.length === 0) return fallback;
  return Math.min(...packages.map((p) => p.amount));
};

type TripPricingInput = Pick<ActivityDTO, 'price' | 'pricePackages' | 'paymentTerms' | 'pricingMode'>;

export const inferTripPricingMode = (trip: TripPricingInput): TripPricingMode => {
  if (trip.pricingMode === 'free' || trip.pricingMode === 'shared' || trip.pricingMode === 'paid') {
    return trip.pricingMode;
  }

  const packages = trip.pricePackages?.filter((p) => p.label.trim()) ?? [];
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

export const tripPricingBadge = (
  trip: TripPricingInput
): { bg: string; text: string; label: string } => {
  const mode = inferTripPricingMode(trip);
  const amount = tripPriceLabel(trip);

  if (mode === 'free') {
    return { bg: 'bg-emerald-500/15', text: 'text-emerald-700', label: TRIP_PRICING_MODE_LABELS.free };
  }
  if (mode === 'shared') {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-800',
      label: (trip.price ?? 0) > 0 ? `${TRIP_PRICING_MODE_LABELS.shared} · ${amount}` : TRIP_PRICING_MODE_LABELS.shared,
    };
  }
  return {
    bg: 'bg-blue-500/15',
    text: 'text-blue-700',
    label: amount !== 'Free' ? `${TRIP_PRICING_MODE_LABELS.paid} · ${amount}` : TRIP_PRICING_MODE_LABELS.paid,
  };
};
