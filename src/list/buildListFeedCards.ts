import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { buildDiscoveryEnrichedCard } from '../discovery/buildDiscoveryEnrichedCard';
import { buildVenueCoverByLocationId, enrichBrowsePosterCover } from './browsePosterCover';

/** Map explore items → enriched list poster card models (`listFeedPosterStandard.ts`). */
export const buildListFeedCards = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined,
  mapPool: ExploreMapItemDTO[] = items
): DiscoveryCardModel[] => {
  const venueCoverByLocationId = buildVenueCoverByLocationId(mapPool);
  return items.map((item) => {
    const base = buildDiscoveryEnrichedCard(item, mapPool, user);
    return enrichBrowsePosterCover(base, venueCoverByLocationId);
  });
};
