import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { enrichListFeedCardModel } from '../list/enrichListFeedCard';
import { buildDiscoveryCardViewModel } from './discoveryCardViewModel';

/**
 * Discovery VM + list/map host & seeking enrichment (R1.5).
 * Shared by `list=1` rows and browse poster base cards before poster-only cover pass.
 */
export const buildDiscoveryEnrichedCard = (
  item: ExploreMapItemDTO,
  mapPool: ExploreMapItemDTO[],
  user?: { id: string } | null
): ExploreCardModel => {
  const { card } = buildDiscoveryCardViewModel(item, { mapItems: mapPool });
  return enrichListFeedCardModel(card, item, mapPool, user);
};
