import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { enrichDiscoveryPeekSelection } from '../discovery/enrichDiscoveryPeekSelection';
import { finalizeExploreCardLinkedRideshare } from '../explore/linkedRideshareExplore';

/** List feed card — discovery VM + linked rideshare + peek selection flags (same as map). */
export const enrichListFeedCardModel = (
  card: ExploreCardModel,
  item: ExploreMapItemDTO,
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined
): ExploreCardModel => {
  const withRideshare = finalizeExploreCardLinkedRideshare(card, item, items);
  return enrichDiscoveryPeekSelection(withRideshare, item, user);
};
