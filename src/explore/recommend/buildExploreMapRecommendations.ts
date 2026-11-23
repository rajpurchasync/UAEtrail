import type { ExploreMapItemDTO, MapExploreViewerGeo } from '@uaetrail/shared-types';
import {
  buildExploreMapRecommendationOrder,
  scoreExploreMapCatalogItem,
} from '@uaetrail/shared-types';

/** Guest / offline fallback — same scorer as API `matching/rank-map-explore*`. */
export const scoreExploreMapRecommendation = (
  item: ExploreMapItemDTO,
  nowMs: number = Date.now(),
  viewerGeo?: MapExploreViewerGeo | null
): number => scoreExploreMapCatalogItem(item, nowMs, { viewerGeo })?.score ?? -1;

export const buildExploreMapRecommendations = (
  items: ExploreMapItemDTO[],
  options?: { limit?: number; nowMs?: number; viewerGeo?: MapExploreViewerGeo | null }
): ExploreMapItemDTO[] => buildExploreMapRecommendationOrder(items, options);