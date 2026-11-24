import {
  isPlaceMapSource,
  resolveExploreDestinationSlugQuery,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { buildExploreMapPayload } from './explore-map.js';
import { readExploreMapMemoryCacheGeneration } from './explore-map-cache.js';
import {
  assertExploreMapBboxQueryAllowed,
  buildExploreMapBboxPage,
  isExploreMapBboxEnabled,
  parseExploreMapBboxParam,
  parseExploreMapLimitParam,
} from './explore-map-bbox.js';
import { applyExploreMapHttpProjection } from './explore-map-list-projection.js';
import {
  applyGuestExploreMapCatalogCap,
  isGuestExploreMapCatalogCapEnabled,
} from './explore-map-guest-catalog-cap.js';

export type ExploreMapRouteQuery = {
  bbox?: string;
  cursor?: string;
  limit?: string;
  area?: string;
  /** Curated destination hub slug — canonical; `area` is legacy alias (MIG-DESTINATION-GEO). */
  destination?: string;
  /** `full` keeps nested activity/venue payloads; default is slim pin projection. */
  projection?: string;
  /** Comma-separated map sources. Omitted = full catalog (list and other readers). */
  sources?: string;
  /** `1` keeps rideshare activities. Omitted drops them when `sources` is set. */
  includeRideshare?: string;
};

const catalogSource = (source: string): string => (isPlaceMapSource(source) ? 'place' : source);

const isRideshareItem = (item: ExploreMapItemDTO): boolean =>
  item.kind === 'rideshare' || item.activity?.activityType === 'rideshare';

/** Home map asks for the layers it will draw. List omits `sources` and keeps the full catalog. */
export const filterExploreMapCatalogItems = (
  items: ExploreMapItemDTO[],
  query: ExploreMapRouteQuery
): ExploreMapItemDTO[] => {
  const sources = query.sources
    ?.split(',')
    .map((source) => source.trim())
    .filter(Boolean);
  if (!sources?.length) return items;
  const allowed = new Set(sources);
  const includeRideshare = query.includeRideshare === '1';
  return items.filter((item) => {
    if (!allowed.has(catalogSource(item.source))) return false;
    if (!includeRideshare && isRideshareItem(item)) return false;
    return true;
  });
};

export type ExploreMapRouteResult = {
  items: ExploreMapItemDTO[];
  nextCursor?: string | null;
  region?: { slug: string | null; bbox: { south: number; west: number; north: number; east: number } };
  cacheGeneration?: number | null;
  /** Anonymous map — subset of pins when server cap enabled; client still limits peek depth. */
  guestCatalogPreview?: boolean;
};

/** Cached catalog rows for a map query — no viewer enrich or HTTP projection. */
export const resolveExploreMapCatalogItemsForQuery = async (
  query: ExploreMapRouteQuery
): Promise<{ items: ExploreMapItemDTO[]; pageMeta?: Omit<ExploreMapRouteResult, 'items'> }> => {
  assertExploreMapBboxQueryAllowed(query);
  const cached = await buildExploreMapPayload();
  const items = filterExploreMapCatalogItems(cached.items, query);
  const bboxRaw = query.bbox?.trim();

  if (bboxRaw && isExploreMapBboxEnabled()) {
    const bbox = parseExploreMapBboxParam(bboxRaw);
    const limit = parseExploreMapLimitParam(query.limit);
    const destinationSlug = resolveExploreDestinationSlugQuery(query);
    const page = buildExploreMapBboxPage({
      items,
      bbox,
      destinationSlug,
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

  return { items };
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
    if (!isGuestExploreMapCatalogCapEnabled()) {
      return { items, guestCatalogPreview: true };
    }
    const capped = applyGuestExploreMapCatalogCap(items);
    return {
      items: capped,
      guestCatalogPreview: true,
    };
  };

  const { items: catalogItems, pageMeta } = await resolveExploreMapCatalogItemsForQuery(input.query);
  const { items: cappedCatalog, guestCatalogPreview } = capGuestCatalogItems(catalogItems);
  const projected = applyExploreMapHttpProjection(cappedCatalog, input.query.projection);

  return {
    items: projected,
    guestCatalogPreview,
    ...pageMeta,
  };
};
