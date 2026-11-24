import { useEffect, useState } from 'react';
import type { ViewerFix } from './placeDistance';
import { readStoredViewerFix, StoredViewerFix, VIEWER_LOCATION_KEY, writeStoredViewerFix } from './viewerLocationStorage';

const FRESH_MS = 5 * 60 * 1000;

type CachedFix = ViewerFix & { at: number };

export type BrowseViewerLocationState = {
  fix: ViewerFix | null;
  pending: boolean;
  denied: boolean;
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

/** One coarse location fix, reused for 5 minutes (browse near-me sort). */
export const useBrowseViewerLocation = (enabled: boolean): BrowseViewerLocationState => {
  const [fix, setFix] = useState<ViewerFix | null>(null);
  const [pending, setPending] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPending(false);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setDenied(true);
      return;
    }
    const cached = readCache();
    if (cached && Date.now() - cached.at < FRESH_MS) {
      setFix({ lat: cached.lat, lng: cached.lng });
      setPending(false);
      setDenied(false);
      return;
    }
    let cancel = false;
    setPending(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancel) return;
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          at: Date.now(),
        };
        writeStoredViewerFix(next.lat, next.lng);
        setFix({ lat: next.lat, lng: next.lng });
        setPending(false);
      },
      () => {
        if (cancel) return;
        setDenied(true);
        setPending(false);
      },
      { enableHighAccuracy: false, maximumAge: FRESH_MS, timeout: 8000 }
    );
    return () => {
      cancel = true;
    };
  }, [enabled]);

  return { fix: enabled ? fix : null, pending: enabled && pending, denied: enabled && denied };
};