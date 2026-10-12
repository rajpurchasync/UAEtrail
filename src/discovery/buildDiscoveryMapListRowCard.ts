import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { enrichListFeedCardModel } from '../list/enrichListFeedCard';
import { buildDiscoveryCardViewModel } from './discoveryCardViewModel';

/** Map-aligned list row (`list=1`) — discovery VM + list host/demand enrichment. */
export const buildDiscoveryMapListRowCard = (
  item: ExploreMapItemDTO,
  mapPool: ExploreMapItemDTO[],
  user?: { id: string } | null
): ExploreCardModel => {
  const { card } = buildDiscoveryCardViewModel(item, { mapItems: mapPool });
  return enrichListFeedCardModel(card, item, mapPool, user);
};
