/**
 * Machine-readable mirror of DOMAIN_CANONICALS §3.1 consumer detail tab wire ids.
 * Guards: `detailSurfaceTabWireGuard.test.ts`.
 */
export const CONSUMER_DETAIL_TAB_WIRE_CANON = {
  activity: ['plan', 'place', 'crew', 'transport'],
  place: ['overview', 'facts', 'transport', 'guide'],
  area: ['overview', 'places', 'activities'],
  shop: ['about', 'location'],
  organisation: ['about', 'outings', 'contact'],
} as const;

export type ConsumerDetailTabWireSurface = keyof typeof CONSUMER_DETAIL_TAB_WIRE_CANON;
