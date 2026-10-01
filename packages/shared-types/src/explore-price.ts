type ExplorePriceLabelKind = 'free' | 'paid' | 'shared';

export interface ExplorePriceInfo {
  kind: ExplorePriceLabelKind;
  badge: string;
}

export interface ExploreActivityDisplayFields {
  priceLabel: ExplorePriceLabelKind;
  priceDisplay: string;
  fromLabel?: string | null;
  toLabel?: string | null;
}

type ExplorePriceInput = {
  isRideshare: boolean;
  price?: number | null;
  rideshareFree?: boolean | null;
  ridesharePriceAed?: number | null;
  priceLabel?: ExplorePriceLabelKind | null;
  priceDisplay?: string | null;
};

type ActivityPriceSource = {
  activityType?: string;
  price?: number | null;
  rideshareFree?: boolean | null;
  ridesharePriceAed?: number | null;
  meetingPoint?: string | null;
  startPoint?: string | null;
  locationName?: string | null;
};

const extractAedAmount = (display: string): number | null => {
  const match = display.match(/AED\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

const normalizeExplorePriceBadge = (
  kind: ExplorePriceLabelKind,
  display: string,
  price?: number | null
): string => {
  if (kind === 'paid') {
    const amount = price ?? extractAedAmount(display);
    return amount != null ? `Paid Event · AED ${amount}` : 'Paid Event';
  }
  return display;
};

/** Resolve explore card price badge — prefers API-provided label/display. */
export const resolveExplorePrice = (input: ExplorePriceInput): ExplorePriceInfo => {
  if (input.priceLabel && input.priceDisplay) {
    return {
      kind: input.priceLabel,
      badge: normalizeExplorePriceBadge(input.priceLabel, input.priceDisplay, input.price),
    };
  }

  if (input.isRideshare) {
    if (input.rideshareFree === true || (input.ridesharePriceAed ?? 0) === 0) {
      return { kind: 'free', badge: 'Free' };
    }
    const amount = input.ridesharePriceAed ?? 0;
    return {
      kind: 'shared',
      badge: `Shared · AED ${amount}/seat`,
    };
  }

  const price = input.price ?? 0;
  if (price <= 0) {
    return { kind: 'free', badge: 'Free' };
  }

  return {
    kind: 'paid',
    badge: `Paid Event · AED ${price}`,
  };
};

const isRideshareActivity = (activity: ActivityPriceSource): boolean =>
  activity.activityType === 'rideshare';

/** Server-side explore map price + route labels for an activity pin. */
export const buildExploreActivityDisplay = (activity: ActivityPriceSource): ExploreActivityDisplayFields => {
  const fromLabel = activity.meetingPoint ?? null;
  const toLabel = activity.startPoint ?? activity.locationName ?? null;
  const rideshare = isRideshareActivity(activity);

  if (rideshare) {
    if (activity.rideshareFree === true || (activity.ridesharePriceAed ?? 0) === 0) {
      return { priceLabel: 'free', priceDisplay: 'Free', fromLabel, toLabel };
    }
    return {
      priceLabel: 'shared',
      priceDisplay: `Shared · AED ${activity.ridesharePriceAed ?? 0}/seat`,
      fromLabel,
      toLabel,
    };
  }

  if ((activity.price ?? 0) <= 0) {
    return { priceLabel: 'free', priceDisplay: 'Free', fromLabel, toLabel };
  }

  return {
    priceLabel: 'paid',
    priceDisplay: `Paid Event · AED ${activity.price}`,
    fromLabel,
    toLabel,
  };
};
