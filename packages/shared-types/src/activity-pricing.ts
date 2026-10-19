import type { HostTierFlags } from './host-publishing-tier.js';
import type { PublishingProfileKind } from './publishing-profile-kind.js';

export type ActivityPricingMode = 'free' | 'shared' | 'paid';

/** @deprecated Prefer `publishingProfileKind` on {@link ActivityPricingContext}. */
export type ActivityPricingPublishProfile = 'guide' | 'agency' | 'shop';

export type ActivityPricingContext = {
  /** Storefront kind for the tenant selected in Host / publish. */
  publishingProfileKind?: PublishingProfileKind | null;
  /** Legacy publish-as wire type — mapped when `publishingProfileKind` is absent. */
  publishProfileType?: ActivityPricingPublishProfile | null;
};

/** Verified business storefronts may list paid commercial outings (not individual pro guides). */
export const publishingProfileKindAllowsPaidActivities = (
  kind?: PublishingProfileKind | null
): boolean => kind === 'agency' || kind === 'shop' || kind === 'partner';

const resolvePricingPublishKind = (context?: ActivityPricingContext): PublishingProfileKind | null => {
  if (context?.publishingProfileKind) return context.publishingProfileKind;
  if (context?.publishProfileType === 'agency') return 'agency';
  if (context?.publishProfileType === 'shop') return 'shop';
  if (context?.publishProfileType === 'guide') return 'pro_guide';
  return null;
};

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

export const allowedActivityPricingModes = (
  hostTiers: HostTierFlags,
  context?: ActivityPricingContext
): ActivityPricingMode[] => {
  const kind = resolvePricingPublishKind(context);
  const linkedBusinessPublish =
    hostTiers.business && publishingProfileKindAllowsPaidActivities(kind);
  if (linkedBusinessPublish) {
    return ['free', 'shared', 'paid'];
  }
  return ['free', 'shared'];
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
