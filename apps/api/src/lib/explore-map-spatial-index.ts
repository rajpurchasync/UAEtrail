import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  exploreMapItemIntersectsBbox,
  type ExploreMapBboxBBox,
} from './explore-map-bbox.js';

/** ~22 km cells at UAE latitudes — coarse grid for bbox prefilter. */
const CELL_DEG = 0.2;

const cellKey = (latitude: number, longitude: number): string =>
  `${Math.floor(latitude / CELL_DEG)}:${Math.floor(longitude / CELL_DEG)}`;

const indexByCatalog = new WeakMap<ExploreMapItemDTO[], Map<string, ExploreMapItemDTO[]>>();

export const getExploreMapSpatialIndex = (
  items: ExploreMapItemDTO[]
): Map<string, ExploreMapItemDTO[]> => {
  const cached = indexByCatalog.get(items);
  if (cached) return cached;

  const index = new Map<string, ExploreMapItemDTO[]>();
  const addPoint = (item: ExploreMapItemDTO, latitude: number, longitude: number) => {
    const key = cellKey(latitude, longitude);
    const bucket = index.get(key);
    if (bucket) {
      if (!bucket.some((entry) => entry.id === item.id)) bucket.push(item);
      return;
    }
    index.set(key, [item]);
  };

  for (const item of items) {
    if (item.latitude != null && item.longitude != null) {
      addPoint(item, item.latitude, item.longitude);
    }
    if (item.toLatitude != null && item.toLongitude != null) {
      addPoint(item, item.toLatitude, item.toLongitude);
    }
  }

  indexByCatalog.set(items, index);
  return index;
};

/** Bbox filter using spatial buckets — avoids scanning the full catalog when bbox is small. */
export const filterExploreMapItemsByBboxIndexed = (
  items: ExploreMapItemDTO[],
  bbox: ExploreMapBboxBBox
): ExploreMapItemDTO[] => {
  const index = getExploreMapSpatialIndex(items);
  const minLatCell = Math.floor(bbox.south / CELL_DEG);
  const maxLatCell = Math.floor(bbox.north / CELL_DEG);
  const minLngCell = Math.floor(bbox.west / CELL_DEG);
  const maxLngCell = Math.floor(bbox.east / CELL_DEG);

  const seen = new Set<string>();
  const filtered: ExploreMapItemDTO[] = [];

  for (let latCell = minLatCell; latCell <= maxLatCell; latCell += 1) {
    for (let lngCell = minLngCell; lngCell <= maxLngCell; lngCell += 1) {
      const bucket = index.get(`${latCell}:${lngCell}`);
      if (!bucket) continue;
      for (const item of bucket) {
        if (seen.has(item.id)) continue;
        if (!exploreMapItemIntersectsBbox(item, bbox)) continue;
        seen.add(item.id);
        filtered.push(item);
      }
    }
  }

  return filtered;
};
