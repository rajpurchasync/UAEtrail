import { MAP_CONFIG } from '../../config/platform';
import { saveExploreMapLocationPreference } from '../../discovery/discoveryPortExploreMapClient';
import type { ViewerFix } from './placeDistance';
import { writeStoredViewerFix } from './viewerLocationStorage';

export type ViewerAnchorSource = 'device' | 'search';

/** Product-wide “where I’m browsing from” — Home, Explore, List, weather, recommendations. */
export type ViewerAnchor = {
  label: string;
  query: string;
  lat: number;
  lng: number;
  source: ViewerAnchorSource;
};

const ANCHOR_KEY = 'uaetrail:viewer-anchor';
const LEGACY_HOME_KEY = 'uaetrail:home.where';

export const VIEWER_ANCHOR_CHANGED_EVENT = 'uaetrail:viewer-anchor';

export const VIEWER_ANCHOR_CHOOSE_LABEL = 'Choose area';

const notifyAnchorChanged = (): void => {
  try {
    window.dispatchEvent(new Event(VIEWER_ANCHOR_CHANGED_EVENT));
  } catch {
    /* no window */
  }
};

const isFiniteCoord = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const normalizeViewerAnchor = (
  raw: {
    label?: string;
    query?: string;
    lat?: number;
    lng?: number;
    source?: ViewerAnchorSource;
    kind?: string;
  } | null
  | undefined
): ViewerAnchor | null => {
  const label = raw?.label?.trim();
  const query = raw?.query?.trim();
  const lat = raw?.lat;
  const lng = raw?.lng;
  if (!label || !query || !isFiniteCoord(lat) || !isFiniteCoord(lng)) return null;
  const source: ViewerAnchorSource = raw?.source === 'search' ? 'search' : 'device';
  return { label, query, lat, lng, source };
};

export const readViewerAnchor = (): ViewerAnchor | null => {
  try {
    const raw = sessionStorage.getItem(ANCHOR_KEY);
    if (raw) {
      return normalizeViewerAnchor(JSON.parse(raw) as ViewerAnchor);
    }
    const legacy = sessionStorage.getItem(LEGACY_HOME_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy) as {
      label?: string;
      query?: string;
      lat?: number;
      lng?: number;
      kind?: string;
    };
    const source: ViewerAnchorSource = parsed.kind === 'emirate' ? 'search' : 'device';
    const anchor = normalizeViewerAnchor({ ...parsed, source });
    if (anchor) {
      writeViewerAnchor(anchor);
      sessionStorage.removeItem(LEGACY_HOME_KEY);
    }
    return anchor;
  } catch {
    return null;
  }
};

export const writeViewerAnchor = (anchor: ViewerAnchor): void => {
  try {
    sessionStorage.setItem(ANCHOR_KEY, JSON.stringify(anchor));
    notifyAnchorChanged();
  } catch {
    /* private mode */
  }
};

/** Persist anchor + session GPS + Explore map prefs (single write path). */
export const applyViewerAnchor = (anchor: ViewerAnchor): void => {
  writeViewerAnchor(anchor);
  writeStoredViewerFix(anchor.lat, anchor.lng);
  saveExploreMapLocationPreference({
    useDeviceLocation: anchor.source === 'device',
    lastLat: anchor.lat,
    lastLng: anchor.lng,
    promptDismissed: true,
  });
};

export const resolveViewerAnchorGeo = (
  sessionFix: ViewerFix | null,
  anchor: ViewerAnchor | null
): ViewerFix => {
  if (anchor) return { lat: anchor.lat, lng: anchor.lng };
  if (sessionFix) return sessionFix;
  return MAP_CONFIG.exploreDefaultCenter;
};

export const resolveViewerAnchorLabel = (
  anchor: ViewerAnchor | null,
  liveAreaLabel: string | null
): string => liveAreaLabel?.trim() || anchor?.label?.trim() || VIEWER_ANCHOR_CHOOSE_LABEL;

/** @deprecated — use {@link ViewerAnchor} */
export type MemberHomeWhere = ViewerAnchor;