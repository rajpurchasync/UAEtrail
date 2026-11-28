import { useEffect, useMemo, useState } from 'react';
import type { ViewerFix } from './placeDistance';
import {
  readViewerAnchor,
  resolveViewerAnchorGeo,
  VIEWER_ANCHOR_CHANGED_EVENT,
  type ViewerAnchor,
} from './viewerAnchor';
import { useBrowseViewerLocation } from './useBrowseViewerLocation';

export const useViewerAnchor = (): ViewerAnchor | null => {
  const [anchor, setAnchor] = useState<ViewerAnchor | null>(() => readViewerAnchor());
  useEffect(() => {
    const refresh = () => setAnchor(readViewerAnchor());
    window.addEventListener(VIEWER_ANCHOR_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(VIEWER_ANCHOR_CHANGED_EVENT, refresh);
  }, []);
  return anchor;
};

/** Session GPS + saved viewer anchor — shared geo for Home, List, Explore recommendations. */
export const useViewerAnchorGeo = (trackSessionGeo: boolean) => {
  const { fix: sessionFix, pending, denied, requestFreshFix } = useBrowseViewerLocation(trackSessionGeo);
  const anchor = useViewerAnchor();
  const geo: ViewerFix = useMemo(
    () => resolveViewerAnchorGeo(trackSessionGeo ? sessionFix : null, anchor),
    [anchor, sessionFix, trackSessionGeo]
  );
  return { geo, anchor, sessionFix, pending, denied, requestFreshFix };
};