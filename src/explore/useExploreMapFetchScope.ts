import { useCallback, useMemo, useState } from 'react';
import type { MapBounds } from '../components/ui/PlacesMap';
import {
  defaultExploreMapFetchScope,
  formatExploreMapBboxParam,
  isExploreMapBboxEnabled,
  type ExploreMapFetchScope,
} from './exploreMapBbox';

/** Viewport-driven bbox for `GET /explore/map?bbox=` when `VITE_EXPLORE_MAP_BBOX=1`. */
export const useExploreMapFetchScope = (areaSlug: string | null) => {
  const bboxFetchEnabled = isExploreMapBboxEnabled();
  const [bbox, setBbox] = useState(() => defaultExploreMapFetchScope().bbox);

  const onVisibleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      if (!bboxFetchEnabled) return;
      const next = formatExploreMapBboxParam(bounds);
      setBbox((prev) => (prev === next ? prev : next));
    },
    [bboxFetchEnabled]
  );

  const scope = useMemo((): ExploreMapFetchScope | null => {
    if (!bboxFetchEnabled) return null;
    return { bbox, area: areaSlug };
  }, [bboxFetchEnabled, bbox, areaSlug]);

  return { bboxFetchEnabled, scope, onVisibleBoundsChange };
};
