import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  canOfferRideshareForAvailabilityItem,
  canShowAvailabilityLinkRideshareOffer,
} from './discoveryPortExploreLinkRideshare';

/**
 * Discovery engagement — handle wire `offer_rideshare` for a selected catalog pin.
 * Crew availability + legacy seeking pins prefill host compose; hosted activity pins link to parent activity.
 */
export const dispatchOfferRideshareFromSelection = (input: {
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

/** Summary surface (map peek) — show Offer rideshare when wire entitlements allow. */
export const discoverySelectionShowsOfferRideshare = (
  selected: ExploreMapItemDTO | null | undefined
): boolean => canShowAvailabilityLinkRideshareOffer(selected);