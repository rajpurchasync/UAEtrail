import type { EventPricePackageDTO } from '@uaetrail/shared-types';

export const TRIP_CURRENCIES = ['AED', 'USD', 'EUR', 'SAR', 'OMR'] as const;
export type TripCurrency = (typeof TRIP_CURRENCIES)[number];

export type TripPricePackage = EventPricePackageDTO;

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
  if (trip.price === 0) return 'Free';
  return `AED ${trip.price.toLocaleString()}`;
};

export const derivePriceAed = (packages: TripPricePackage[], fallback = 0): number => {
  if (packages.length === 0) return fallback;
  return Math.min(...packages.map((p) => p.amount));
};
