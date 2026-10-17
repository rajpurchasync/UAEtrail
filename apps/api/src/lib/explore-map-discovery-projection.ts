import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildApiDiscoveryCardProjection } from './discovery-card-projection.js';

/** When `EXPLORE_MAP_DISCOVERY_PROJECTION=1`, map responses include `discoveryCard` per item (MIG-EXPLORE-READ). */
export const isExploreMapDiscoveryProjectionEnabled = (): boolean =>
  process.env.EXPLORE_MAP_DISCOVERY_PROJECTION?.trim() === '1';

export const enrichExploreMapItemsDiscoveryProjection = (
  items: ExploreMapItemDTO[]
): ExploreMapItemDTO[] => {
  if (!isExploreMapDiscoveryProjectionEnabled()) {
    return items;
  }
  return items.map((item) => ({
    ...item,
    discoveryCard: buildApiDiscoveryCardProjection(item)
  }));
};
