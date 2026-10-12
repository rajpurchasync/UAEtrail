import { getMapBounds } from '../config/regions';
import type { MapBounds } from '../components/ui/PlacesMap';

export const isExploreMapVnextEnabled = (): boolean =>
  import.meta.env.VITE_EXPLORE_MAP_VNEXT === '1';

export type ExploreMapFetchScope = {
  /** `west,south,east,north` degrees (API vNext). */
  bbox: string;
  /** Optional curated area slug — server filter when vNext API flag is on. */
  area?: string | null;
};

export const formatExploreMapBboxParam = (bounds: MapBounds): string =>
  `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;

export const defaultExploreMapFetchScope = (): ExploreMapFetchScope => ({
  bbox: formatExploreMapBboxParam(getMapBounds()),
  area: null,
});
