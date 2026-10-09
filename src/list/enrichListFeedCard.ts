import { exploreMapItemIsHostedActivity, exploreMapItemIsSeeking, type ExploreMapItemDTO } from '@uaetrail/shared-types';
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
  const next = finalizeExploreCardLinkedRideshare(card, item, items);

  const activity = next.activity;
  const isOwnActivity = Boolean(
    user && activity && exploreMapItemIsHostedActivity(item) && viewerIsActivityHostUser(activity, user.id)
  );
  const isOwnDemand = Boolean(
    user &&
      exploreMapItemIsSeeking(item) &&
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
