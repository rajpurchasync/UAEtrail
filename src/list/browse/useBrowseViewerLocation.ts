import { useCallback, useEffect, useState } from 'react';
import type { ViewerFix } from './placeDistance';
import { StoredViewerFix, VIEWER_LOCATION_KEY, writeStoredViewerFix } from './viewerLocationStorage';
import { getExploreMapLocationPreference } from '../../explore/exploreMapLocationPreference';
import { readViewerAnchor } from './viewerAnchor';
import { requestViewerGeolocationFix, type ViewerGeolocationFailure } from './viewerGeolocation';

const FRESH_MS = 5 * 60 * 1000;

type CachedFix = ViewerFix & { at: number };

export type BrowseViewerLocationState = {
  fix: ViewerFix | null;
  pending: boolean;
  denied: boolean;
  /** Force a new device read (e.g. “Use my location”). */
  requestFreshFix: () => Promise<ViewerFix | null>;
  lastFailure: ViewerGeolocationFailure | null;
};

const readCache = (): CachedFix | null => {
  try {
    const raw = sessionStorage.getItem(VIEWER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredViewerFix;
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng) || !Number.isFinite(parsed.at)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const persistFix = (next: ViewerFix): void => {
  writeStoredViewerFix(next.lat, next.lng);
};

/** One coarse location fix, reused for 5 minutes (browse near-me sort). */
export const useBrowseViewerLocation = (enabled: boolean): BrowseViewerLocationState => {
  const [fix, setFix] = useState<ViewerFix | null>(null);
  const [pending, setPending] = useState(false);
  const [denied, setDenied] = useState(false);
  const [lastFailure, setLastFailure] = useState<ViewerGeolocationFailure | null>(null);

  const applyResult = useCallback((result: Awaited<ReturnType<typeof requestViewerGeolocationFix>>) => {
    if (result.ok) {
      persistFix(result.fix);
      setFix(result.fix);
      setDenied(false);
      setLastFailure(null);
      return result.fix;
    }
    setDenied(result.code === 'denied');
    setLastFailure(result.code);
    return null;
  }, []);

  const requestFreshFix = useCallback((): Promise<ViewerFix | null> => {
    setPending(true);
    setDenied(false);
    return requestViewerGeolocationFix()
      .then((result) => applyResult(result))
      .finally(() => setPending(false));
  }, [applyResult]);

  useEffect(() => {
    if (!enabled) {
      setPending(false);
      return;
    }
    const savedAnchor = readViewerAnchor();
    if (savedAnchor) {
      setFix({ lat: savedAnchor.lat, lng: savedAnchor.lng });
      setPending(false);
      setDenied(false);
      return;
    }
    const cached = readCache();
    if (cached && Date.now() - cached.at < FRESH_MS) {
      setFix({ lat: cached.lat, lng: cached.lng });
      setPending(false);
      setDenied(false);
      return;
    }
    const pref = getExploreMapLocationPreference();
    if (pref.lastLat != null && pref.lastLng != null) {
      setFix({ lat: pref.lastLat, lng: pref.lastLng });
      setPending(false);
      setDenied(false);
      return;
    }
    setPending(false);
    setDenied(false);
  }, [enabled]);

  return {
    fix: enabled ? fix : null,
    pending: enabled && pending,
    denied: enabled && denied,
    requestFreshFix,
    lastFailure,
  };
};