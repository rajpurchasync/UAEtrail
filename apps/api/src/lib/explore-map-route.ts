import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreMapPayload } from './explore-map.js';
import { readExploreMapMemoryCacheGeneration } from './explore-map-cache.js';
import {
  assertExploreMapBboxQueryAllowed,
  buildExploreMapBboxPage,
  isExploreMapBboxEnabled,
  parseExploreMapBboxParam,
  parseExploreMapLimitParam,
} from './explore-map-bbox.js';
import { enrichExploreMapItemsDiscoveryProjection } from './explore-map-discovery-projection.js';
import { applyExploreMapHttpProjection } from './explore-map-list-projection.js';

export type ExploreMapRouteQuery = {
  bbox?: string;
  cursor?: string;
  limit?: string;
  area?: string;
  /** `full` keeps nested activity/venue payloads; default is slim pin projection. */
  projection?: string;
};

export type ExploreMapRouteResult = {
  items: ExploreMapItemDTO[];
  nextCursor?: string | null;
  region?: { slug: string | null; bbox: { south: number; west: number; north: number; east: number } };
  cacheGeneration?: number | null;
  /** Anonymous map — full pin catalog; peek depth gated in the client (3 unique items). */
  guestCatalogPreview?: boolean;
};

/** Cached catalog rows for a map query — no viewer enrich or HTTP projection. */
export const resolveExploreMapCatalogItemsForQuery = async (
  query: ExploreMapRouteQuery
): Promise<{ items: ExploreMapItemDTO[]; pageMeta?: Omit<ExploreMapRouteResult, 'items'> }> => {
  assertExploreMapBboxQueryAllowed(query);
  const cached = await buildExploreMapPayload();
  const bboxRaw = query.bbox?.trim();

  if (bboxRaw && isExploreMapBboxEnabled()) {
    const bbox = parseExploreMapBboxParam(bboxRaw);
    const limit = parseExploreMapLimitParam(query.limit);
    const areaSlug = query.area?.trim() || null;
    const page = buildExploreMapBboxPage({
      items: cached.items,
      bbox,
      areaSlug,
      limit,
      cursor: query.cursor?.trim() || null,
    });
    return {
      items: page.items,
      pageMeta: {
        nextCursor: page.nextCursor,
        region: page.region,
        cacheGeneration: readExploreMapMemoryCacheGeneration(),
      },
    };
  }

  return { items: cached.items };
};

export const loadExploreMapForRequest = async (input: {
  query: ExploreMapRouteQuery;
  viewerUserId: string | null;
  userRole: string | null | undefined;
}): Promise<ExploreMapRouteResult> => {
  const applyGuestCap = !input.viewerUserId;

  const capGuestCatalogItems = (
    items: ExploreMapItemDTO[]
  ): { items: ExploreMapItemDTO[]; guestCatalogPreview: boolean } => {
    if (!applyGuestCap) {
      return { items, guestCatalogPreview: false };
    }
    return { items, guestCatalogPreview: true };
  };

  const { items: catalogItems, pageMeta } = await resolveExploreMapCatalogItemsForQuery(input.query);
  const { items: cappedCatalog, guestCatalogPreview } = capGuestCatalogItems(catalogItems);
  const projected = applyExploreMapHttpProjection(
    enrichExploreMapItemsDiscoveryProjection(cappedCatalog),
    input.query.projection
  );

  return {
    items: projected,
    guestCatalogPreview,
    ...pageMeta,
  };
};
