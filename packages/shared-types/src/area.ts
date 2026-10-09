/** Curated outdoor geography between emirate (`region`) and place pins. */

export type AreaStatus = 'draft' | 'published';

/** Closed polygon ring — vertices in order (first point need not repeat). */
export type AreaBoundsRing = Array<{ latitude: number; longitude: number }>;

export interface AreaCenter {
  latitude: number;
  longitude: number;
}

export interface AreaDTO {
  id: string;
  slug: string;
  name: string;
  /** Emirate / region label (e.g. Dubai, RAK). */
  region: string;
  status: AreaStatus;
  center: AreaCenter;
  bounds: AreaBoundsRing;
  /** Lower number wins when a point lies in multiple polygons. */
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/** Public card — no admin-only fields beyond status filter at API. */
export type AreaPublicDTO = Pick<
  AreaDTO,
  'id' | 'slug' | 'name' | 'region' | 'center' | 'bounds'
>;

export const areaDetailPath = (slug: string): string => `/area/${encodeURIComponent(slug)}`;

export const exploreAreaQueryParam = 'area';

/** Ray-casting point-in-polygon (WGS84 lat/lng). */
export const pointInAreaBounds = (
  latitude: number,
  longitude: number,
  ring: AreaBoundsRing
): boolean => {
  if (ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].longitude;
    const yi = ring[i].latitude;
    const xj = ring[j].longitude;
    const yj = ring[j].latitude;
    const intersect =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi + 0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

/** Approximate ring area (km²) for overlap tie-break — shoelace on equirectangular projection. */
export const approximateAreaBoundsKm2 = (ring: AreaBoundsRing): number => {
  if (ring.length < 3) return Number.POSITIVE_INFINITY;
  const lat0 =
    ring.reduce((sum, p) => sum + p.latitude, 0) / ring.length;
  const cosLat = Math.cos((lat0 * Math.PI) / 180);
  const toKm = (dLat: number, dLng: number) => {
    const x = dLng * cosLat * 111.32;
    const y = dLat * 110.574;
    return { x, y };
  };
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const p1 = toKm(a.latitude, a.longitude);
    const p2 = toKm(b.latitude, b.longitude);
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area) / 2;
};
