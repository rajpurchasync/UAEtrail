import type { ExploreMapItemDTO, MapExploreViewerGeo } from '@uaetrail/shared-types';
import type { DiscoverMapRecommendationRowDTO } from '@uaetrail/shared-types';
import { buildExploreMapRecommendations } from './buildExploreMapRecommendations';

/** Merge server rank order onto loaded map catalog; guest falls back to client v0. */
export const resolveExploreMapRecommendationItems = (
  mapItems: ExploreMapItemDTO[],
  serverRows: DiscoverMapRecommendationRowDTO[] | undefined,
  limit = 8,
  viewerGeo?: MapExploreViewerGeo | null
): ExploreMapItemDTO[] => {
  if (!serverRows?.length) {
    return buildExploreMapRecommendations(mapItems, { limit, viewerGeo });
  }
  const byId = new Map(mapItems.map((item) => [item.id, item]));
  const ordered: ExploreMapItemDTO[] = [];
  for (const row of serverRows) {
    const item = byId.get(row.exploreItemId);
    if (item) ordered.push(item);
    if (ordered.length >= limit) break;
  }
  if (ordered.length > 0) return ordered;
  return buildExploreMapRecommendations(mapItems, { limit, viewerGeo });
};