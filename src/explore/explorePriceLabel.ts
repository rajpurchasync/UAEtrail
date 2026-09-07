export type ExplorePriceLabelKind = 'free' | 'paid' | 'shared';

export interface ExplorePriceInfo {
  kind: ExplorePriceLabelKind;
  badge: string;
  showOfflineNote: boolean;
}

export const OFFLINE_PAYMENT_NOTE = 'Payment arranged directly with the host.';

export const resolveExplorePrice = (input: {
  isCarpool: boolean;
  price?: number | null;
  carPoolFree?: boolean | null;
  carPoolPriceAed?: number | null;
  priceLabel?: ExplorePriceLabelKind | null;
  priceDisplay?: string | null;
}): ExplorePriceInfo => {
  if (input.priceLabel && input.priceDisplay) {
    return {
      kind: input.priceLabel,
      badge: input.priceDisplay,
      showOfflineNote: input.priceLabel !== 'free',
    };
  }

  if (input.isCarpool) {
    if (input.carPoolFree === true || (input.carPoolPriceAed ?? 0) === 0) {
      return { kind: 'free', badge: 'Free', showOfflineNote: false };
    }
    const amount = input.carPoolPriceAed ?? 0;
    return {
      kind: 'shared',
      badge: `Shared · AED ${amount}/seat`,
      showOfflineNote: true,
    };
  }

  const price = input.price ?? 0;
  if (price <= 0) {
    return { kind: 'free', badge: 'Free', showOfflineNote: false };
  }

  return {
    kind: 'paid',
    badge: `Paid · AED ${price}`,
    showOfflineNote: true,
  };
};
