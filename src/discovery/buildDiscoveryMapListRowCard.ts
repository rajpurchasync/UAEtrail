import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { buildDiscoveryEnrichedCard } from './buildDiscoveryEnrichedCard';

/** Map-aligned list row (`list=1`) — discovery VM + list host/demand enrichment. */
export const buildDiscoveryMapListRowCard = (
  item: ExploreMapItemDTO,
  mapPool: ExploreMapItemDTO[],
  user?: { id: string } | null
): DiscoveryCardModel => buildDiscoveryEnrichedCard(item, mapPool, user);
