import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';
import { UAE_LAND_BBOX, type UaeBbox } from './uae-bbox.js';

const DEFAULT_PAGE_LIMIT = 150;
const MAX_PAGE_LIMIT = 300;

export const isExploreMapBboxEnabled = (): boolean =>
  process.env.EXPLORE_MAP_BBOX?.trim() === '1';

export type ExploreMapBboxBBox = UaeBbox;

export type ExploreMapBboxPage = {
  items: ExploreMapItemDTO[];
  nextCursor: string | null;
  region: { slug: string | null; bbox: ExploreMapBboxBBox };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Intersect client bbox with UAE land envelope. */
export const clampExploreMapBboxToUae = (bbox: ExploreMapBboxBBox): ExploreMapBboxBBox => ({
  south: clamp(bbox.south, UAE_LAND_BBOX.south, UAE_LAND_BBOX.north),
  west: clamp(bbox.west, UAE_LAND_BBOX.west, UAE_LAND_BBOX.east),
  north: clamp(bbox.north, UAE_LAND_BBOX.south, UAE_LAND_BBOX.north),
  east: clamp(bbox.east, UAE_LAND_BBOX.west, UAE_LAND_BBOX.east),
});

/** `west,south,east,north` in WGS84 degrees. */
export const parseExploreMapBboxParam = (raw: string): ExploreMapBboxBBox => {
  const parts = raw.split(',').map((part) => part.trim());
  if (parts.length !== 4) {
    throw new ApiError(400, 'explore_map_bbox_invalid', 'bbox must be west,south,east,north');
  }
  const [west, south, east, north] = parts.map((part) => Number(part));
  if ([west, south, east, north].some((n) => !Number.isFinite(n))) {
    throw new ApiError(400, 'explore_map_bbox_invalid', 'bbox must be numeric degrees');
  }
  if (south > north || west > east) {
    throw new ApiError(400, 'explore_map_bbox_invalid', 'bbox south≤north and west≤east required');
  }
  const clamped = clampExploreMapBboxToUae({ south, west, north, east });
  if (clamped.south >= clamped.north || clamped.west >= clamped.east) {
    throw new ApiError(400, 'explore_map_bbox_outside_uae', 'bbox does not intersect UAE');
  }
  return clamped;
};

export const parseExploreMapLimitParam = (raw: string | undefined): number => {
  if (!raw) return DEFAULT_PAGE_LIMIT;
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 1) {
    throw new ApiError(400, 'explore_map_limit_invalid', 'limit must be a positive integer');
  }
  return Math.min(Math.floor(limit), MAX_PAGE_LIMIT);
};

const pointInBbox = (latitude: number, longitude: number, bbox: ExploreMapBboxBBox): boolean =>
  latitude >= bbox.south &&
  latitude <= bbox.north &&
  longitude >= bbox.west &&
  longitude <= bbox.east;

/** Pin visible when primary or carpool destination lies inside the bbox. */
export const exploreMapItemIntersectsBbox = (
  item: ExploreMapItemDTO,
  bbox: ExploreMapBboxBBox
): boolean => {
  const { latitude, longitude, toLatitude, toLongitude } = item;
  if (latitude != null && longitude != null && pointInBbox(latitude, longitude, bbox)) {
    return true;
  }
  if (toLatitude != null && toLongitude != null && pointInBbox(toLatitude, toLongitude, bbox)) {
    return true;
  }
  return false;
};

export const filterExploreMapItemsByBbox = (
  items: ExploreMapItemDTO[],
  bbox: ExploreMapBboxBBox
): ExploreMapItemDTO[] => items.filter((item) => exploreMapItemIntersectsBbox(item, bbox));

export const filterExploreMapItemsByAreaSlug = (
  items: ExploreMapItemDTO[],
  areaSlug: string
): ExploreMapItemDTO[] =>
  items.filter(
    (item) =>
      item.areaSlug === areaSlug ||
      (item.source === 'area' && item.id === `area:${areaSlug}`)
  );

type CursorPayload = { sortKey: string; id: string };

const encodeCursor = (payload: CursorPayload): string =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

const decodeCursor = (raw: string): CursorPayload => {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as CursorPayload;
    if (!parsed || typeof parsed.sortKey !== 'string' || typeof parsed.id !== 'string') {
      throw new Error('invalid');
    }
    return parsed;
  } catch {
    throw new ApiError(400, 'explore_map_cursor_invalid', 'cursor is not valid');
  }
};

const exploreMapItemSortKey = (item: ExploreMapItemDTO): string => {
  const date = item.date?.trim() || '';
  const time = item.time?.trim() || '';
  return `${date}\t${time}\t${item.id}`;
};

const compareExploreMapItems = (a: ExploreMapItemDTO, b: ExploreMapItemDTO): number => {
  const keyA = exploreMapItemSortKey(a);
  const keyB = exploreMapItemSortKey(b);
  if (keyA < keyB) return -1;
  if (keyA > keyB) return 1;
  return 0;
};

export const sortExploreMapItemsForPagination = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] =>
  [...items].sort(compareExploreMapItems);

export const paginateExploreMapItems = (input: {
  items: ExploreMapItemDTO[];
  limit: number;
  cursor: string | null | undefined;
}): { items: ExploreMapItemDTO[]; nextCursor: string | null } => {
  const sorted = sortExploreMapItemsForPagination(input.items);
  let startIndex = 0;
  if (input.cursor) {
    const decoded = decodeCursor(input.cursor);
    const cursorIndex = sorted.findIndex(
      (item) => item.id === decoded.id && exploreMapItemSortKey(item) === decoded.sortKey
    );
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }
  const slice = sorted.slice(startIndex, startIndex + input.limit);
  const last = slice[slice.length - 1];
  const hasMore = startIndex + input.limit < sorted.length;
  const nextCursor =
    hasMore && last
      ? encodeCursor({ sortKey: exploreMapItemSortKey(last), id: last.id })
      : null;
  return { items: slice, nextCursor };
};

export const buildExploreMapBboxPage = (input: {
  items: ExploreMapItemDTO[];
  bbox: ExploreMapBboxBBox;
  areaSlug: string | null;
  limit: number;
  cursor: string | null | undefined;
}): ExploreMapBboxPage => {
  let filtered = filterExploreMapItemsByBbox(input.items, input.bbox);
  if (input.areaSlug) {
    filtered = filterExploreMapItemsByAreaSlug(filtered, input.areaSlug);
  }
  const page = paginateExploreMapItems({
    items: filtered,
    limit: input.limit,
    cursor: input.cursor,
  });
  return {
    items: page.items,
    nextCursor: page.nextCursor,
    region: { slug: input.areaSlug, bbox: input.bbox },
  };
};

export const assertExploreMapBboxQueryAllowed = (query: {
  bbox?: string;
  cursor?: string;
  limit?: string;
}): void => {
  const hasBboxParam = Boolean(query.bbox || query.cursor || query.limit);
  if (!hasBboxParam) return;
  if (!isExploreMapBboxEnabled()) {
    throw new ApiError(
      400,
      'explore_map_bbox_disabled',
      'bbox, cursor, and limit query params require EXPLORE_MAP_BBOX=1'
    );
  }
  if ((query.cursor || query.limit) && !query.bbox) {
    throw new ApiError(400, 'explore_map_bbox_required', 'bbox is required with cursor or limit');
  }
};
