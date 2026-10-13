import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { buildDiscoveryEnrichedCard } from './buildDiscoveryEnrichedCard';

/** Map-aligned list row (`list=1`) — discovery VM + list host/demand enrichment. */
export const buildDiscoveryMapListRowCard = (
  item: ExploreMapItemDTO,
  mapPool: ExploreMapItemDTO[],
  user?: { id: string } | null
): ExploreCardModel => buildDiscoveryEnrichedCard(item, mapPool, user);
