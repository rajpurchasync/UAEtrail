import type { ExploreCardModel } from '../../exploreCardModel';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

/**
 * Map peek template family — pairs with consumer detail templates on `card.path`.
 * Facility pins are on the map (`source: facility`) but share Place peek until a facility peek ships.
 */
export type MapPeekSurface = 'activity' | 'place' | 'facility' | 'area' | 'shop' | 'other';

export const resolveMapPeekSurfaceFromCard = (card: ExploreCardModel): MapPeekSurface => {
  if (card.source === 'facility') return 'facility';
  if (isGeographyMapSource(card.source)) return 'place';
  if (card.source === 'activity') return 'activity';
  if (card.source === 'area') return 'area';
  if (card.source === 'shop') return 'shop';
  return 'other';
};

export const resolveMapPeekSurfaceFromItem = (item: ExploreMapItemDTO): MapPeekSurface => {
  if (item.source === 'facility') return 'facility';
  if (isGeographyMapSource(item.source)) return 'place';
  if (item.source === 'activity') return 'activity';
  if (item.source === 'area') return 'area';
  if (item.source === 'shop') return 'shop';
  return 'other';
};
