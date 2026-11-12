import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { hostedOutingSummariesByPlaceId } from '../explore/exploreOptionalFilters';
import { buildDiscoveryEnrichedCard } from '../discovery/buildDiscoveryEnrichedCard';
import { buildVenueCoverByLocationId, enrichBrowsePosterCover } from './browsePosterCover';

/** Map explore items → enriched list poster card models (`listFeedPosterStandard.ts`). */
export const buildListFeedCards = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined,
  mapPool: ExploreMapItemDTO[] = items
): DiscoveryCardModel[] => {
  const venueCoverByLocationId = buildVenueCoverByLocationId(mapPool);
  const outingsByPlaceId = hostedOutingSummariesByPlaceId(mapPool);
  return items.map((item) => {
    const base = buildDiscoveryEnrichedCard(item, mapPool, user);
    const covered = enrichBrowsePosterCover(base, venueCoverByLocationId);
    const locationId = covered.locationId?.trim();
    const outings = locationId ? outingsByPlaceId.get(locationId) : undefined;
    if (!outings) return covered;
    return {
      ...covered,
      venueUpcomingOutingCount: outings.count,
      venueNextOutingIso: outings.nextDateIso,
      venueNextOutingPath: outings.nextPath,
      venueNextOutingExploreItemId: outings.nextExploreItemId,
    };
  });
};
