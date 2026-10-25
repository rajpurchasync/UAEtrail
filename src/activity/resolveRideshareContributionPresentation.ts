import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { buildExploreActivityDisplay } from '@uaetrail/shared-types';
import { resolveActivityExploreMapPrice } from './resolveActivityExploreMapPrice';

export type RideshareContributionPresentation = {
  kind: 'free' | 'shared' | 'paid';
  /** Matches map peek `card.price.badge`. */
  headerBadge: string;
  /** Matches map `priceDisplay`, with seat-contribution context on detail. */
  detailLabel: string;
  showDirectPaymentNote: boolean;
};

/** Ride share money copy on consumer detail — aligned with explore map / peek price. */
export const resolveRideshareContributionPresentation = (
  activity: ActivityDetailDTO
): RideshareContributionPresentation => {
  const display = buildExploreActivityDisplay(activity);
  const price = resolveActivityExploreMapPrice(activity);

  if (price.kind === 'free') {
    return {
      kind: 'free',
      headerBadge: price.badge,
      detailLabel: 'No seat contribution — fuel and costs are on the host',
      showDirectPaymentNote: false,
    };
  }

  if (price.kind === 'shared') {
    return {
      kind: 'shared',
      headerBadge: price.badge,
      detailLabel: `${display.priceDisplay} — arranged directly with the host`,
      showDirectPaymentNote: true,
    };
  }

  return {
    kind: 'paid',
    headerBadge: price.badge,
    detailLabel: `${display.priceDisplay} — confirm with the host before you join`,
    showDirectPaymentNote: true,
  };
};
