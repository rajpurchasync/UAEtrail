import type { GeoKind, GeoNodeLite } from '@uaetrail/shared-types';
import type { GeoStore } from '../../geo/geoStore';

/**
 * Geo-tree zoom chips (country / emirate / area). Not rendered on `/explore` —
 * the map shows clustered places, activities, and facilities instead.
 */
export const EXPLORE_GEO_BUBBLE_PIN_MIN_ZOOM = 9;
/** Country bubbles at regional GCC zoom. */
export const EXPLORE_GEO_BUBBLE_COUNTRY_MAX_ZOOM = 6;
/** State/emirate bubbles at zoom 7; area bubbles at default zoom 8. */
export const EXPLORE_GEO_BUBBLE_STATE_MAX_ZOOM = 7;

export type ExploreGeoBubble = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  kind: GeoKind;
  flyToZoom: number;
};

export const geoBubbleKindForZoom = (zoom: number): GeoKind | null => {
  if (zoom >= EXPLORE_GEO_BUBBLE_PIN_MIN_ZOOM) return null;
  if (zoom <= EXPLORE_GEO_BUBBLE_COUNTRY_MAX_ZOOM) return 'country';
  if (zoom <= EXPLORE_GEO_BUBBLE_STATE_MAX_ZOOM) return 'state';
  return 'area';
};

export const geoBubbleFlyToZoom = (kind: GeoKind): number => {
  if (kind === 'country') return EXPLORE_GEO_BUBBLE_STATE_MAX_ZOOM;
  if (kind === 'state') return EXPLORE_GEO_BUBBLE_STATE_MAX_ZOOM + 1;
  return EXPLORE_GEO_BUBBLE_PIN_MIN_ZOOM;
};

const descendantCount = (store: GeoStore, id: string): number => {
  const kids = store.childrenOf(id);
  return kids.reduce((sum, child) => sum + 1 + descendantCount(store, child.id), 0);
};

const hasKind = (store: GeoStore, kind: GeoKind): boolean => {
  for (const node of store.byId.values()) {
    if (node.kind === kind) return true;
  }
  return false;
};

export const resolveGeoBubbleKind = (store: GeoStore, zoom: number): GeoKind | null => {
  const wanted = geoBubbleKindForZoom(zoom);
  if (!wanted) return null;
  if (wanted === 'area' && !hasKind(store, 'area')) {
    return hasKind(store, 'state') ? 'state' : 'country';
  }
  if (wanted === 'state' && !hasKind(store, 'state')) return 'country';
  return wanted;
};

const toBubble = (node: GeoNodeLite, store: GeoStore): ExploreGeoBubble | null => {
  const [lng, lat] = node.c;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const count = Math.max(descendantCount(store, node.id), 1);
  return {
    id: node.id,
    name: node.n,
    lat,
    lng,
    count,
    kind: node.kind,
    flyToZoom: geoBubbleFlyToZoom(node.kind),
  };
};

export const exploreGeoBubblesForZoom = (store: GeoStore, zoom: number): ExploreGeoBubble[] => {
  const kind = resolveGeoBubbleKind(store, zoom);
  if (!kind) return [];
  const out: ExploreGeoBubble[] = [];
  for (const node of store.byId.values()) {
    if (node.kind !== kind) continue;
    const bubble = toBubble(node, store);
    if (bubble) out.push(bubble);
  }
  return out;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Circle count + name — reuses explore cluster circle chrome. */
export const buildGeoBubbleHtml = (name: string, count: number): { html: string; width: number; height: number } => {
  const label = count > 99 ? '99+' : String(count);
  const safeName = escapeHtml(name);
  const html = `<span class="uaetrail-map-geo-bubble"><span class="uaetrail-map-cluster uaetrail-map-geo-bubble-count">${label}</span><span class="uaetrail-map-geo-bubble-label">${safeName}</span></span>`;
  const width = Math.min(220, 44 + Math.max(label.length, name.length) * 7);
  return { html, width, height: 48 };
};
