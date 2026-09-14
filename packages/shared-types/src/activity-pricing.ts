export interface ActivityPricePackage {
  label: string;
  amount: number;
  currency: string;
}
export type ActivityPricingMode = 'free' | 'shared' | 'paid';
export type ActivityCurrency = 'AED' | 'USD' | 'EUR' | 'SAR' | 'OMR';

export const ACTIVITY_CURRENCIES: readonly ActivityCurrency[] = ['AED', 'USD', 'EUR', 'SAR', 'OMR'];

const ACTIVITY_PRICING_MODE_LABELS: Record<ActivityPricingMode, string> = {
  free: 'Free',
  shared: 'Cost Shared',
  paid: 'Professional paid activity',
};

export type ActivityPricingInput = {
  price: number;
  pricePackages?: ActivityPricePackage[] | null;
  paymentTerms?: string | null;
  pricingMode?: ActivityPricingMode | null;
};

const isActivityCurrency = (value: unknown): value is ActivityCurrency =>
  typeof value === 'string' && (ACTIVITY_CURRENCIES as readonly string[]).includes(value);

export const isActivityPricePackage = (value: unknown): value is ActivityPricePackage => {
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
    isActivityCurrency(pkg.currency ?? 'AED')
  );
};

/** Parse stored Mongo/API price packages — lenient read path for legacy docs. */
export const parseStoredPricePackages = (value: unknown): ActivityPricePackage[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isActivityPricePackage)
    .slice(0, 12)
    .map((pkg) => ({
      label: pkg.label.trim(),
      amount: pkg.amount,
      currency: (pkg.currency ?? 'AED') as ActivityCurrency,
    }));
};

export const derivePriceAed = (packages: ActivityPricePackage[], fallback = 0): number => {
  if (packages.length === 0) return fallback;
  return Math.min(...packages.map((pkg) => pkg.amount));
};

export const normalizeActivityPricing = (input: {
  price?: number;
  pricePackages?: ActivityPricePackage[];
  pricingMode?: ActivityPricingMode;
}): { priceAed: number; pricePackages: ActivityPricePackage[]; pricingMode: ActivityPricingMode } => {
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

export const formatPackagePrice = (pkg: Pick<ActivityPricePackage, 'amount' | 'currency'>): string => {
  if (pkg.amount === 0) return 'Free';
  return `${pkg.currency} ${pkg.amount.toLocaleString()}`;
};

export const activityHasPaidPricing = (activity: {
  price: number;
  pricePackages?: ActivityPricePackage[] | null;
}): boolean => {
  const packages = activity.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [];
  return activity.price > 0 || packages.some((pkg) => pkg.amount > 0);
};

export const activityPriceLabel = (activity: {
  price: number;
  pricePackages?: ActivityPricePackage[] | null;
}): string => {
  const packages = activity.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [];
  if (packages.length > 1) {
    const paid = packages.filter((pkg) => pkg.amount > 0);
    if (paid.length === 0) return 'Free';
    const min = paid.reduce((a, b) => (a.amount <= b.amount ? a : b));
    return `From ${formatPackagePrice(min)}`;
  }
  if (packages.length === 1) return formatPackagePrice(packages[0]);
  const price = activity.price ?? 0;
  if (price === 0) return 'Free';
  return `AED ${price.toLocaleString()}`;
};

export const inferActivityPricingMode = (activity: ActivityPricingInput): ActivityPricingMode => {
  if (activity.pricingMode === 'free' || activity.pricingMode === 'shared' || activity.pricingMode === 'paid') {
    return activity.pricingMode;
  }

  const packages = activity.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [];
  if (!activityHasPaidPricing({ price: activity.price, pricePackages: packages })) return 'free';

  if (packages.length > 1) return 'paid';

  const terms = activity.paymentTerms?.trim() ?? '';
  if (terms.length > 0 && packages.length <= 1) {
    return 'shared';
  }

  return 'paid';
};

export const activityPricingModeLabel = (activity: ActivityPricingInput): string =>
  ACTIVITY_PRICING_MODE_LABELS[inferActivityPricingMode(activity)];

export const eventHasPaidPricing = (input: {
  price?: number | null;
  pricePackages?: ActivityPricePackage[] | null;
}): boolean =>
  activityHasPaidPricing({
    price: input.price ?? 0,
    pricePackages: input.pricePackages ?? [],
  });
