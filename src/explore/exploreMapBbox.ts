import { getMapBounds } from '../config/regions';
import type { MapBounds } from '../components/ui/PlacesMap';

export const isExploreMapBboxEnabled = (): boolean =>
  import.meta.env.VITE_EXPLORE_MAP_BBOX === '1';

export type ExploreMapFetchScope = {
  /** `west,south,east,north` degrees (bbox-scoped map fetch). */
  bbox: string;
  /** Optional curated area slug — server filter when bbox API flag is on. */
  area?: string | null;
};

const roundBboxCoord = (value: number): number => Math.round(value * 10_000) / 10_000;

/** Stable bbox string for query keys (avoids refetch churn from float jitter). */
export const formatExploreMapBboxParam = (bounds: MapBounds): string =>
  [
    roundBboxCoord(bounds.west),
    roundBboxCoord(bounds.south),
    roundBboxCoord(bounds.east),
    roundBboxCoord(bounds.north),
  ].join(',');

export const defaultExploreMapFetchScope = (): ExploreMapFetchScope => ({
  bbox: formatExploreMapBboxParam(getMapBounds()),
  area: null,
});
