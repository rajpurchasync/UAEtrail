import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreMapPayload } from './explore-map.js';
import {
  readExploreMapMemoryCache,
  readExploreMapMemoryCacheGeneration,
} from './explore-map-cache.js';
import { enrichExploreMapPayloadViewerAccess } from './explore-map-viewer-access.js';

type ViewerEnrichedCacheEntry = {
  mapGeneration: number;
  items: ExploreMapItemDTO[];
};

const viewerEnrichedByKey = new Map<string, ViewerEnrichedCacheEntry>();

export const invalidateExploreMapMemberEngagementCache = (): void => {
  viewerEnrichedByKey.clear();
};

const viewerCacheKey = (viewerUserId: string | null, userRole?: string | null): string =>
  `${viewerUserId ?? 'guest'}:${userRole ?? ''}`;

/**
 * Explore map items with viewer access — shared by member discovery, buddy presence, and people rosters.
 * Reuses enrich per viewer until the base explore map cache generation changes.
 */
export const loadExploreMapItemsForMemberEngagement = async (input: {
  viewerUserId: string | null;
  userRole?: string | null;
}): Promise<ExploreMapItemDTO[]> => {
  const now = Date.now();
  const mapGeneration = readExploreMapMemoryCacheGeneration(now);
  const cacheKey = viewerCacheKey(input.viewerUserId, input.userRole);

  if (mapGeneration != null) {
    const hit = viewerEnrichedByKey.get(cacheKey);
    if (hit && hit.mapGeneration === mapGeneration) return hit.items;
  }

  const payload =
    readExploreMapMemoryCache<{ items: ExploreMapItemDTO[] }>(now) ?? await buildExploreMapPayload();
  const enriched = await enrichExploreMapPayloadViewerAccess(payload, {
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
  });

  const generation = readExploreMapMemoryCacheGeneration(now) ?? now;
  viewerEnrichedByKey.set(cacheKey, { mapGeneration: generation, items: enriched.items });
  return enriched.items;
};
