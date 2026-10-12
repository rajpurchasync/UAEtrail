import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { buildDiscoveryCardViewModel } from '../discovery/discoveryCardViewModel';
import { buildVenueCoverByLocationId, enrichBrowsePosterCover } from './browsePosterCover';
import { enrichListFeedCardModel } from './enrichListFeedCard';

/** Map explore items → enriched list poster card models (`listFeedPosterStandard.ts`). */
export const buildListFeedCards = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined,
  mapPool: ExploreMapItemDTO[] = items
): ExploreCardModel[] => {
  const venueCoverByLocationId = buildVenueCoverByLocationId(mapPool);
  return items.map((item) => {
    const { card: base } = buildDiscoveryCardViewModel(item, { mapItems: mapPool });
    const card = enrichBrowsePosterCover(base, venueCoverByLocationId);
    return enrichListFeedCardModel(card, item, mapPool, user);
  });
};
