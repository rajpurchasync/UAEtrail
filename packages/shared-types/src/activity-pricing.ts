import type { HostTierFlags } from './host-publishing-tier.js';

export type ActivityPricingMode = 'free' | 'shared' | 'paid';

const ACTIVITY_PRICING_MODE_LABELS: Record<ActivityPricingMode, string> = {
  free: 'Free',
  shared: 'Cost shared',
  paid: 'Paid (indicative)',
};

export type ActivityPricingInput = {
  price: number;
  paymentTerms?: string | null;
  pricingMode?: ActivityPricingMode | null;
};

/** Indicative amounts only — UAE Trail does not process payments. */
export const ACTIVITY_PRICING_INDICATION_NOTE =
  'Prices are indicative for planning. Payment is arranged directly with the host — not through UAE Trail.';

export const allowedActivityPricingModes = (hostTiers: HostTierFlags): ActivityPricingMode[] => {
  if (hostTiers.business) return ['free', 'shared', 'paid'];
  if (hostTiers.professional) return ['free', 'shared'];
  return ['free'];
};

export const normalizeActivityPricing = (input: {
  price?: number;
  pricingMode?: ActivityPricingMode;
}): { priceAed: number; pricingMode: ActivityPricingMode } => {
  const priceAed = Math.max(0, Math.round(input.price ?? 0));
  const pricingMode =
    input.pricingMode ??
    (priceAed > 0 ? 'shared' : 'free');

  if (pricingMode === 'free') {
    return { priceAed: 0, pricingMode: 'free' };
  }

  if (pricingMode === 'shared') {
    return { priceAed, pricingMode: 'shared' };
  }

  return { priceAed, pricingMode: 'paid' };
};

export const activityHasPaidPricing = (activity: ActivityPricingInput): boolean => {
  if (activity.pricingMode === 'paid' || activity.pricingMode === 'shared') return true;
  return (activity.price ?? 0) > 0;
};

export const activityPriceLabel = (activity: ActivityPricingInput): string => {
  const mode = inferActivityPricingMode(activity);
  const price = activity.price ?? 0;
  if (mode === 'free' || price === 0) return 'Free';
  return `AED ${price.toLocaleString()}`;
};

export const inferActivityPricingMode = (activity: ActivityPricingInput): ActivityPricingMode => {
  if (activity.pricingMode === 'free' || activity.pricingMode === 'shared' || activity.pricingMode === 'paid') {
    return activity.pricingMode;
  }
  if ((activity.price ?? 0) <= 0) return 'free';
  const terms = activity.paymentTerms?.trim() ?? '';
  if (terms.length > 0) return 'shared';
  return 'shared';
};

export const activityPricingModeLabel = (activity: ActivityPricingInput): string =>
  ACTIVITY_PRICING_MODE_LABELS[inferActivityPricingMode(activity)];

export const eventHasPaidPricing = (input: {
  price?: number | null;
  pricingMode?: ActivityPricingMode | null;
}): boolean =>
  activityHasPaidPricing({
    price: input.price ?? 0,
    pricingMode: input.pricingMode ?? null,
  });
