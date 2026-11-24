/** Session cache for one coarse viewer fix — shared by map locate, browse sort, and search “where”. */
export const VIEWER_LOCATION_KEY = 'uaetrail:viewer-location';

export type StoredViewerFix = {
  lat: number;
  lng: number;
  at: number;
};

export const readStoredViewerFix = (): { lat: number; lng: number } | null => {
  try {
    const raw = sessionStorage.getItem(VIEWER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredViewerFix>;
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    return { lat: parsed.lat as number, lng: parsed.lng as number };
  } catch {
    return null;
  }
};

export const writeStoredViewerFix = (lat: number, lng: number): void => {
  try {
    const payload: StoredViewerFix = { lat, lng, at: Date.now() };
    sessionStorage.setItem(VIEWER_LOCATION_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
};