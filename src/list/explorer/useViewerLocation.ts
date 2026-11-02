import { useEffect, useState } from 'react';
import type { ViewerFix } from './placeDistance';

const STORAGE_KEY = 'uaetrail:viewer-location';
const FRESH_MS = 5 * 60 * 1000;

type CachedFix = ViewerFix & { at: number };

const readCache = (): CachedFix | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFix;
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng) || !Number.isFinite(parsed.at)) return null;
    return parsed;
  } catch {
    return null;
  }
};

/**
 * One coarse location fix, reused for 5 minutes. No watch and no server round-trip.
 * Returns null when location is unavailable.
 */
export const useViewerLocation = (enabled: boolean): ViewerFix | null => {
  const [fix, setFix] = useState<ViewerFix | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return;
    const cached = readCache();
    if (cached && Date.now() - cached.at < FRESH_MS) {
      setFix({ lat: cached.lat, lng: cached.lng });
      return;
    }
    let cancel = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancel) return;
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          at: Date.now(),
        };
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* private mode */
        }
        setFix({ lat: next.lat, lng: next.lng });
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: FRESH_MS, timeout: 8000 }
    );
    return () => {
      cancel = true;
    };
  }, [enabled]);

  return enabled ? fix : null;
};
