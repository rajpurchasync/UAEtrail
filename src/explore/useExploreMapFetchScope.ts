import { useCallback, useMemo, useState } from 'react';
import type { MapBounds } from '../components/ui/PlacesMap';
import {
  defaultExploreMapFetchScope,
  formatExploreMapBboxParam,
  isExploreMapVnextEnabled,
  type ExploreMapFetchScope,
} from './exploreMapVnext';

/** Viewport-driven bbox for `GET /explore/map?bbox=` when `VITE_EXPLORE_MAP_VNEXT=1`. */
export const useExploreMapFetchScope = (areaSlug: string | null) => {
  const vnextEnabled = isExploreMapVnextEnabled();
  const [bbox, setBbox] = useState(() => defaultExploreMapFetchScope().bbox);

  const onVisibleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      if (!vnextEnabled) return;
      const next = formatExploreMapBboxParam(bounds);
      setBbox((prev) => (prev === next ? prev : next));
    },
    [vnextEnabled]
  );

  const scope = useMemo((): ExploreMapFetchScope | null => {
    if (!vnextEnabled) return null;
    return { bbox, area: areaSlug };
  }, [vnextEnabled, bbox, areaSlug]);

  return { vnextEnabled, scope, onVisibleBoundsChange };
};
