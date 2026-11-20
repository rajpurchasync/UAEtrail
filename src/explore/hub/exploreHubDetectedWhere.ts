import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';
import { getExploreMapLocationPreference } from '../exploreMapLocationPreference';
import { inferEmirateFromPin } from '../hostingPublishArea';

const VIEWER_LOCATION_KEY = 'uaetrail:viewer-location';

const readViewerFix = (): { lat: number; lng: number } | null => {
  try {
    const raw = sessionStorage.getItem(VIEWER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    return { lat: parsed.lat as number, lng: parsed.lng as number };
  } catch {
    return null;
  }
};

const emirateToSearchQuery = (emirate: string): string =>
  EXPLORE_REGION_PILL_LABELS[emirate] ?? emirate;

/** Best-effort “near you” label for hub home where — map pref, then session fix, then Dubai. */
export const resolveExploreHubDetectedWhereQuery = (): string => {
  const pref = getExploreMapLocationPreference();
  if (pref.lastLat != null && pref.lastLng != null) {
    const emirate = inferEmirateFromPin(pref.lastLat, pref.lastLng, []);
    if (emirate) return emirateToSearchQuery(emirate);
  }
  const viewer = readViewerFix();
  if (viewer) {
    const emirate = inferEmirateFromPin(viewer.lat, viewer.lng, []);
    if (emirate) return emirateToSearchQuery(emirate);
  }
  return 'Dubai';
};