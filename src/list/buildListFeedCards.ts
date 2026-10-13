import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel, type ExploreCardModel } from '../explore/exploreCardModel';
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
    const card = enrichBrowsePosterCover(buildExploreCardModel(item), venueCoverByLocationId);
    return enrichListFeedCardModel(card, item, mapPool, user);
  });
};
