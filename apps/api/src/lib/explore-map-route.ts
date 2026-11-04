import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreMapPayload } from './explore-map.js';
import { readExploreMapMemoryCacheGeneration } from './explore-map-cache.js';
import {
  applyGuestExploreMapCatalogCap,
  guestExploreMapCatalogCapApplied,
  isGuestExploreMapCatalogCapEnabled,
} from './explore-map-guest-catalog-cap.js';
import { enrichExploreMapPayloadViewerAccess } from './explore-map-viewer-access.js';
import {
  assertExploreMapBboxQueryAllowed,
  buildExploreMapBboxPage,
  isExploreMapBboxEnabled,
  parseExploreMapBboxParam,
  parseExploreMapLimitParam,
} from './explore-map-bbox.js';
import { enrichExploreMapItemsDiscoveryProjection } from './explore-map-discovery-projection.js';

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
  /** Anonymous map preview — capped places/events per session policy. */
  guestCatalogPreview?: boolean;
};

export const loadExploreMapForRequest = async (input: {
  query: ExploreMapRouteQuery;
  viewerUserId: string | null;
  userRole: string | null | undefined;
}): Promise<ExploreMapRouteResult> => {
  assertExploreMapBboxQueryAllowed(input.query);
  const applyGuestCap = !input.viewerUserId;

  const finishGuestPayload = (payload: ExploreMapRouteResult): ExploreMapRouteResult => {
    if (!applyGuestCap || !isGuestExploreMapCatalogCapEnabled()) return payload;
    const before = payload.items;
    const items = applyGuestExploreMapCatalogCap(before);
    return {
      ...payload,
      items,
      guestCatalogPreview: guestExploreMapCatalogCapApplied(before, items),
    };
  };

  const cached = await buildExploreMapPayload();
  const bboxRaw = input.query.bbox?.trim();

  if (bboxRaw && isExploreMapBboxEnabled()) {
    const bbox = parseExploreMapBboxParam(bboxRaw);
    const limit = parseExploreMapLimitParam(input.query.limit);
    const areaSlug = input.query.area?.trim() || null;
    const page = buildExploreMapBboxPage({
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
    const items = enrichExploreMapItemsDiscoveryProjection(enriched.items);
    return finishGuestPayload({
      items,
      nextCursor: page.nextCursor,
      region: page.region,
      cacheGeneration: readExploreMapMemoryCacheGeneration(),
    });
  }

  const enriched = await enrichExploreMapPayloadViewerAccess(cached, {
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
  });
  const items = enrichExploreMapItemsDiscoveryProjection(enriched.items);
  return finishGuestPayload({ items });
};
