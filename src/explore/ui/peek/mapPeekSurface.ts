import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

/**
 * Map peek template family — pairs with consumer detail templates on `card.path`.
 * Facility pins use the place shell with facility actions (directions + facility page).
 */
export type MapPeekSurface = 'activity' | 'place' | 'facility' | 'destination' | 'shop' | 'other';

export const resolveMapPeekSurfaceFromCard = (card: DiscoveryCardModel): MapPeekSurface => {
  if (card.source === 'facility') return 'facility';
  if (isGeographyMapSource(card.source)) return 'place';
  if (card.source === 'activity') return 'activity';
  if (card.kind === 'destination') return 'destination';
  if (card.source === 'shop') return 'shop';
  return 'other';
};

export const resolveMapPeekSurfaceFromItem = (item: ExploreMapItemDTO): MapPeekSurface => {
  if (item.source === 'facility') return 'facility';
  if (isGeographyMapSource(item.source)) return 'place';
  if (item.source === 'activity') return 'activity';
  if (item.kind === 'destination') return 'destination';
  if (item.source === 'shop') return 'shop';
  return 'other';
};
