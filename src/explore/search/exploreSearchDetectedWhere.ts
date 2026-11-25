import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';
import { readStoredViewerFix } from '../../discovery/discoverySession';
import { getExploreMapLocationPreference } from '../exploreMapLocationPreference';
import { inferEmirateFromPin } from '../hostingPublishDestination';

const emirateToSearchQuery = (emirate: string): string =>
  EXPLORE_REGION_PILL_LABELS[emirate] ?? emirate;

const whereFromCoords = (lat: number, lng: number): string => {
  const emirate = inferEmirateFromPin(lat, lng, []);
  return emirate ? emirateToSearchQuery(emirate) : '';
};

/**
 * Best-effort “near you” label for booking search — map last fix, session GPS, then product default map center.
 * Works for guests (no account). Sign-in only affects search limits, not location detection.
 */
export const resolveExploreSearchDetectedWhereQuery = (): string => {
  const pref = getExploreMapLocationPreference();
  if (pref.lastLat != null && pref.lastLng != null) {
    const fromPref = whereFromCoords(pref.lastLat, pref.lastLng);
    if (fromPref) return fromPref;
  }

  const viewer = readStoredViewerFix();
  if (viewer) {
    const fromViewer = whereFromCoords(viewer.lat, viewer.lng);
    if (fromViewer) return fromViewer;
  }

  /** Product-wide default when GPS is off — UAE hub most members search first. */
  return EXPLORE_REGION_PILL_LABELS.Dubai ?? 'Dubai';
};