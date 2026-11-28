import { resolveViewerAnchorGeo } from '../list/browse/viewerAnchor';
import type { ViewerAnchor } from '../list/browse/viewerAnchor';
import { EXPLORE_REGION_PILL_LABELS, getRegionsForCountry } from '../config/regions';

const normalize = (value: string): string => value.trim().toLowerCase();

/** Map a label to a UAE emirate catalog key (legacy tests / search hints). */
export const matchMemberHomeEmirateKey = (label: string | null | undefined): string | null => {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  const norm = normalize(trimmed);
  for (const key of getRegionsForCountry('AE')) {
    const display = EXPLORE_REGION_PILL_LABELS[key] ?? key;
    if (norm === normalize(key) || norm === normalize(display)) return key;
  }
  return null;
};

export const resolveMemberHomeWeatherCoords = (
  geoFix: { lat: number; lng: number } | null,
  anchor: ViewerAnchor | null
) => resolveViewerAnchorGeo(geoFix, anchor);