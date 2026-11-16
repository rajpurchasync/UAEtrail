import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  canOfferRideshareForAvailabilityItem,
  canShowAvailabilityLinkRideshareOffer,
} from './linkActivityRideshareOffer';

/** Map/list peek — offer a linked rideshare beside a crew availability or legacy seeking pin. */
export const runPeekOfferRideshare = (input: {
  selected: ExploreMapItemDTO | null | undefined;
  activity: ActivityDTO | null | undefined;
  onOfferRideshareForAvailability?: () => void;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
}): void => {
  const { selected, activity, onOfferRideshareForAvailability, onCreateLinkedRideshare } = input;
  if (selected && onOfferRideshareForAvailability && canOfferRideshareForAvailabilityItem(selected)) {
    onOfferRideshareForAvailability();
    return;
  }
  if (activity && onCreateLinkedRideshare) {
    onCreateLinkedRideshare(activity);
  }
};

export const availabilityPeekShowsOfferRideshare = (
  selected: ExploreMapItemDTO | null | undefined
): boolean => canShowAvailabilityLinkRideshareOffer(selected);