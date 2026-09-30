/** Approximate UAE outer envelope (south, west, north, east). */
export const UAE_LAND_BBOX = {
  south: 22.63,
  west: 51.0,
  north: 26.09,
  east: 56.38,
} as const;

export type UaeBbox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const inBox = (latitude: number, longitude: number, bbox: UaeBbox): boolean =>
  latitude >= bbox.south &&
  latitude <= bbox.north &&
  longitude >= bbox.west &&
  longitude <= bbox.east;

export const isWithinUaeBbox = (
  latitude: number,
  longitude: number,
  bbox: UaeBbox = UAE_LAND_BBOX
): boolean => inBox(latitude, longitude, bbox);

/**
 * UAE-focused pins — excludes Musandam / eastern Oman Hajar spill that shares the wide bbox.
 * Fujairah coast and Jebel Jais (RAK) remain inside the east-coast band.
 */
export const isWithinUaeFocusArea = (latitude: number, longitude: number): boolean => {
  if (!isWithinUaeBbox(latitude, longitude)) return false;

  // North of UAE mainland (Musandam / north Oman)
  if (latitude > 26.06) return false;

  // Interior Oman east of the UAE mountain border (keep Jebel Jais ~56.11)
  if (longitude >= 56.26 && latitude >= 25.35) return false;

  // South-east Oman / Empty Quarter spill east of UAE
  if (longitude >= 56.2 && latitude < 24.85) return false;

  // Musandam wedge (Oman) between RAK and Strait of Hormuz
  if (latitude >= 25.96 && longitude >= 56.18) return false;

  return true;
};

export const uaeFocusRejectReason = (latitude: number, longitude: number): string | null =>
  isWithinUaeFocusArea(latitude, longitude) ? null : 'geo:outside-uae-focus';
