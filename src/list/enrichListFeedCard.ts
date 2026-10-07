import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { finalizeExploreCardLinkedRideshare } from '../explore/linkedRideshareExplore';
import { canOfferRideshareForDemandItem } from '../explore/linkActivityRideshareOffer';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';

/** Same host/demand flags as explore map peek selection. */
export const enrichListFeedCardModel = (
  card: ExploreCardModel,
  item: ExploreMapItemDTO,
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined
): ExploreCardModel => {
  let next = finalizeExploreCardLinkedRideshare(card, item, items);

  const activity = next.activity;
  const isOwnActivity = Boolean(
    user && activity && item.source === 'activity' && viewerIsActivityHostUser(activity, user.id)
  );
  const isOwnDemand = Boolean(
    user &&
      item.source === 'demand' &&
      item.requesterUserId === user.id &&
      item.participantIntentId &&
      !item.convertedActivityId
  );

  if (isOwnDemand) {
    return {
      ...next,
      showJoinActions: false,
      showDemandOwnerActions: true,
      showDemandLinkRideshare: canOfferRideshareForDemandItem(item),
    };
  }

  if (isOwnActivity) {
    return {
      ...next,
      showJoinActions: false,
      showHostActivityCtas: true,
    };
  }

  return next;
};
