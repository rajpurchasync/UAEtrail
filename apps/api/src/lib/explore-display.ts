import type { ActivityDTO, ExplorePriceLabelKind } from '@uaetrail/shared-types';

export interface ExploreActivityDisplayFields {
  priceLabel: ExplorePriceLabelKind;
  priceDisplay: string;
  fromLabel?: string | null;
  toLabel?: string | null;
}

const isCarpoolActivity = (activity: ActivityDTO): boolean =>
  activity.activityType === 'carpool';

export const buildExploreActivityDisplay = (activity: ActivityDTO): ExploreActivityDisplayFields => {
  const fromLabel = activity.meetingPoint ?? null;
  const toLabel = activity.startPoint ?? activity.locationName ?? null;
  const carpool = isCarpoolActivity(activity);

  if (carpool) {
    if (activity.carPoolFree === true || (activity.carPoolPriceAed ?? 0) === 0) {
      return {
        priceLabel: 'free',
        priceDisplay: 'Free',
        fromLabel,
        toLabel,
      };
    }
    return {
      priceLabel: 'shared',
      priceDisplay: `Shared · AED ${activity.carPoolPriceAed ?? 0}/seat`,
      fromLabel,
      toLabel,
    };
  }

  if ((activity.price ?? 0) <= 0) {
    return {
      priceLabel: 'free',
      priceDisplay: 'Free',
      fromLabel,
      toLabel,
    };
  }

  return {
    priceLabel: 'paid',
    priceDisplay: `Paid · AED ${activity.price}`,
    fromLabel,
    toLabel,
  };
};
