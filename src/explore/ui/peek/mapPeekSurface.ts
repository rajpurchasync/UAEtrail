import type { ExploreCardModel } from '../../exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

/** Map peek template family — pairs with consumer detail templates on `card.path`. */
export type MapPeekSurface = 'activity' | 'place' | 'area' | 'shop' | 'other';

export const resolveMapPeekSurfaceFromCard = (card: ExploreCardModel): MapPeekSurface => {
  if (card.source === 'venue') return 'place';
  if (card.source === 'activity') return 'activity';
  if (card.source === 'area') return 'area';
  if (card.source === 'shop') return 'shop';
  return 'other';
};

export const resolveMapPeekSurfaceFromItem = (item: ExploreMapItemDTO): MapPeekSurface => {
  if (item.source === 'venue') return 'place';
  if (item.source === 'activity') return 'activity';
  if (item.source === 'area') return 'area';
  if (item.source === 'shop') return 'shop';
  return 'other';
};
