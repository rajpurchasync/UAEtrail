import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreMapPayload } from './explore-map.js';
import { readExploreMapMemoryCacheGeneration } from './explore-map-cache.js';
import { enrichExploreMapPayloadViewerAccess } from './explore-map-viewer-access.js';
import {
  assertExploreMapVnextQueryAllowed,
  buildExploreMapVnextPage,
  isExploreMapVnextEnabled,
  parseExploreMapBboxParam,
  parseExploreMapLimitParam,
} from './explore-map-vnext.js';

export type ExploreMapRouteQuery = {
  bbox?: string;
  cursor?: string;
  limit?: string;
  area?: string;
};

export type ExploreMapRouteResult = {
  items: ExploreMapItemDTO[];
  nextCursor?: string | null;
  region?: { slug: string | null; bbox: { south: number; west: number; north: number; east: number } };
  cacheGeneration?: number | null;
};

export const loadExploreMapForRequest = async (input: {
  query: ExploreMapRouteQuery;
  viewerUserId: string | null;
  userRole: string | null | undefined;
}): Promise<ExploreMapRouteResult> => {
  assertExploreMapVnextQueryAllowed(input.query);

  const cached = await buildExploreMapPayload();
  const bboxRaw = input.query.bbox?.trim();

  if (bboxRaw && isExploreMapVnextEnabled()) {
    const bbox = parseExploreMapBboxParam(bboxRaw);
    const limit = parseExploreMapLimitParam(input.query.limit);
    const areaSlug = input.query.area?.trim() || null;
    const page = buildExploreMapVnextPage({
      items: cached.items,
      bbox,
      areaSlug,
      limit,
      cursor: input.query.cursor?.trim() || null,
    });
    const enriched = await enrichExploreMapPayloadViewerAccess(
      { items: page.items },
      { viewerUserId: input.viewerUserId, userRole: input.userRole }
    );
    return {
      items: enriched.items,
      nextCursor: page.nextCursor,
      region: page.region,
      cacheGeneration: readExploreMapMemoryCacheGeneration(),
    };
  }

  const enriched = await enrichExploreMapPayloadViewerAccess(cached, {
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
  });
  return { items: enriched.items };
};
