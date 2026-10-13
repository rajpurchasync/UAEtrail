import { exploreMapItemIsSeeking, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModel, type DiscoveryCardViewModel } from '../discovery';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';
import { canShowDemandLinkRideshareOffer } from './linkActivityRideshareOffer';

/** Map peek card VM with host/demand owner affordances (C18). */
export const buildExploreSelectionSelectedCard = (
  selected: ExploreMapItemDTO | null,
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined
): DiscoveryCardViewModel | null => {
  if (!selected) return null;
  const card = buildDiscoveryCardViewModel(selected, { mapItems: items }).card;
  const activity = card.activity;
  const isOwnActivity = Boolean(
    user && activity && selected.source === 'activity' && viewerIsActivityHostUser(activity, user.id)
  );
  const isOwnDemand = Boolean(
    user &&
      exploreMapItemIsSeeking(selected) &&
      selected.requesterUserId === user.id &&
      selected.participantIntentId &&
      !selected.convertedActivityId
  );
  if (isOwnDemand) {
    return {
      ...card,
      showJoinActions: false,
      showDemandOwnerActions: true,
      showDemandLinkRideshare: canShowDemandLinkRideshareOffer(selected),
    };
  }
  if (!isOwnActivity) return card;
  return {
    ...card,
    showJoinActions: false,
  };
};
