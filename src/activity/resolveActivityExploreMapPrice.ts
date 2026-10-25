import type { ActivityDetailDTO, ExplorePriceInfo } from '@uaetrail/shared-types';
import { buildExploreActivityDisplay, resolveExplorePrice } from '@uaetrail/shared-types';

/** Same price label/display path as `GET /explore/map` pins and map peek cards. */
export const resolveActivityExploreMapPrice = (activity: ActivityDetailDTO): ExplorePriceInfo => {
  const display = buildExploreActivityDisplay(activity);
  return resolveExplorePrice({
    isRideshare: activity.activityType === 'rideshare',
    price: activity.price ?? null,
    rideshareFree: activity.rideshareFree ?? null,
    ridesharePriceAed: activity.ridesharePriceAed ?? null,
    priceLabel: display.priceLabel,
    priceDisplay: display.priceDisplay,
  });
};
