/** Curated outdoor **Destination** — public `/destinations`, catalog `destinationId`. */

export type DestinationStatus = 'draft' | 'published';

/** Closed polygon ring — vertices in order (first point need not repeat). */
export type DestinationBoundsRing = Array<{ latitude: number; longitude: number }>;

export interface DestinationCenter {
  latitude: number;
  longitude: number;
}

export interface DestinationDTO {
  id: string;
  slug: string;
  name: string;
  /** Emirate / region label (e.g. Dubai, RAK). */
  region: string;
  status: DestinationStatus;
  center: DestinationCenter;
  bounds: DestinationBoundsRing;
  /** Lower number wins when a point lies in multiple polygons. */
  priority: number;
  /** Short public blurb for destination hub and detail. */
  summary?: string | null;
  /** ISO country code (catalog default `AE`). */
  countryCode?: string | null;
  /** Hero image for `/destination/:slug` and admin. */
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Public card — no admin-only fields beyond status filter at API. */
export type DestinationPublicDTO = Pick<
  DestinationDTO,
  | 'id'
  | 'slug'
  | 'name'
  | 'region'
  | 'center'
  | 'bounds'
  | 'priority'
  | 'summary'
  | 'countryCode'
  | 'imageUrl'
>;

/** Ray-casting point-in-polygon (WGS84 lat/lng). */
export const pointInDestinationBounds = (
  latitude: number,
  longitude: number,
  ring: DestinationBoundsRing
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
export const approximateDestinationBoundsKm2 = (ring: DestinationBoundsRing): number => {
  if (ring.length < 3) return Number.POSITIVE_INFINITY;
  const lat0 = ring.reduce((sum, p) => sum + p.latitude, 0) / ring.length;
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

/** Public hub URL — `/destination/:slug` only. */
export const destinationHubPath = (slug: string): string =>
  `/destination/${encodeURIComponent(slug)}`;

/** Explore / list filter query key. */
export const exploreDestinationQueryParam = 'destination' as const;

export type ExploreDestinationSlugQuery = {
  destination?: string | null;
};

export const resolveExploreDestinationSlugQuery = (
  query: ExploreDestinationSlugQuery
): string | null => {
  const destination = query.destination?.trim().toLowerCase();
  return destination || null;
};

export type DestinationAssignableRow = {
  destinationId?: string | null;
};

export const resolveDestinationId = (
  row: DestinationAssignableRow | null | undefined
): string | null => row?.destinationId?.trim() || null;

/** Mongo/catalog patch shape for assigning a destination on create or update. */
export const catalogDestinationIdUpdate = (
  destinationId: string | null | undefined
): { destinationId: string | null } => ({
  destinationId: destinationId?.trim() || null,
});

export type ExploreMapDestinationLensItem = {
  destinationSlug?: string | null;
};

export const exploreMapItemMatchesDestinationSlug = (
  item: ExploreMapDestinationLensItem,
  slug: string
): boolean => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return true;
  return item.destinationSlug?.toLowerCase() === normalized;
};

export const filterExploreMapItemsByDestinationSlug = <T extends ExploreMapDestinationLensItem>(
  items: T[],
  slug: string | null | undefined
): T[] => {
  if (!slug?.trim()) return items;
  return items.filter((item) => exploreMapItemMatchesDestinationSlug(item, slug));
};