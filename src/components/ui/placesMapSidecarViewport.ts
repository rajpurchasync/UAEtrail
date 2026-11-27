import type { Map as LeafletMap } from 'leaflet';
import { MAP_CONFIG } from '../../config/platform';

/** Pin is “in view” with this inset from each edge (near-corner triggers pan). */
export const SIDECAR_MAP_VIEWPORT_EDGE_INSET = 0.12;

export const exploreMapDefaultCenter = (): { lat: number; lng: number } => MAP_CONFIG.exploreDefaultCenter;

export const resolveSidecarSessionZoom = (
  sessionZoom: number | null,
  mapZoom: number
): number => sessionZoom ?? mapZoom ?? MAP_CONFIG.exploreDefaultZoom;

export const isLatLngInComfortableView = (
  map: LeafletMap,
  lat: number,
  lng: number,
  edgeInset = SIDECAR_MAP_VIEWPORT_EDGE_INSET
): boolean => {
  const point = map.latLngToContainerPoint([lat, lng]);
  const size = map.getSize();
  if (size.x <= 0 || size.y <= 0) return true;

  const insetX = size.x * edgeInset;
  const insetY = size.y * edgeInset;

  return (
    point.x >= insetX &&
    point.x <= size.x - insetX &&
    point.y >= insetY &&
    point.y <= size.y - insetY
  );
};

export const anyPinOutsideComfortableView = (
  map: LeafletMap,
  coords: Array<{ lat: number; lng: number }>
): boolean => coords.some((entry) => !isLatLngInComfortableView(map, entry.lat, entry.lng));

export const sidecarFocusCenter = (
  coords: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } => {
  if (coords.length === 0) return exploreMapDefaultCenter();
  if (coords.length === 1) return coords[0]!;
  const lat = coords.reduce((sum, entry) => sum + entry.lat, 0) / coords.length;
  const lng = coords.reduce((sum, entry) => sum + entry.lng, 0) / coords.length;
  return { lat, lng };
};

type ListHoverFocusPin = {
  latitude: number;
  longitude: number;
  rideshareEndpoint?: 'from' | 'to';
};

/**
 * List-hover map focus — prefer the card meeting point / rideshare `from` pin.
 * Averaging from→to (Marina↔Jebel Jais) pans the sidecar into empty desert at typical zoom.
 */
export const resolveListHoverMapFocus = (
  related: readonly ListHoverFocusPin[],
  highlightFocus?: { lat: number; lng: number } | null
): { lat: number; lng: number } | null => {
  if (
    highlightFocus != null &&
    Number.isFinite(highlightFocus.lat) &&
    Number.isFinite(highlightFocus.lng)
  ) {
    return { lat: highlightFocus.lat, lng: highlightFocus.lng };
  }
  if (related.length === 0) return null;
  const fromPin = related.find((entry) => entry.rideshareEndpoint === 'from');
  if (fromPin) return { lat: fromPin.latitude, lng: fromPin.longitude };
  if (related.some((entry) => entry.rideshareEndpoint != null) && related.length > 1) {
    return { lat: related[0]!.latitude, lng: related[0]!.longitude };
  }
  if (related.length === 1) {
    return { lat: related[0]!.latitude, lng: related[0]!.longitude };
  }
  return sidecarFocusCenter(
    related.map((entry) => ({ lat: entry.latitude, lng: entry.longitude }))
  );
};