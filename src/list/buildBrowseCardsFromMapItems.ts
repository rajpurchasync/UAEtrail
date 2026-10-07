import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel, type ExploreCardModel } from '../explore/exploreCardModel';
import { buildVenueCoverByLocationId, enrichBrowsePosterCover } from './browsePosterCover';
import { enrichListFeedCardModel } from './enrichListFeedCard';

/** Full explore map → poster cards (discover home rails — not list filter state). */
export const buildBrowseCardsFromMapItems = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined
): ExploreCardModel[] => {
  const venueCoverByLocationId = buildVenueCoverByLocationId(items);
  return items.map((item) => {
    const card = enrichBrowsePosterCover(buildExploreCardModel(item), venueCoverByLocationId);
    return enrichListFeedCardModel(card, item, items, user);
  });
};
