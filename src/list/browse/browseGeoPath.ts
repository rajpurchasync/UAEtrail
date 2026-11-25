import type { ExploreMapItemDTO, GeoKind, GeoNodeLite } from '@uaetrail/shared-types';
import type { DestinationPublicDTO } from '@uaetrail/shared-types';
import { mergeVenueStateFilterOptionsWithDestinations } from '../../config/regions';
import { geoStore } from '../../geo/geoStore';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';

export const BROWSE_GEO_PARAM = 'geo';

export const parseBrowseGeoPath = (raw: string | null | undefined): string[] => {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split('/').map((part) => part.trim()).filter(Boolean))].slice(0, 3);
};

export const serializeBrowseGeoPath = (ids: readonly string[]): string | null => {
  const next = ids.map((id) => id.trim()).filter(Boolean).slice(0, 3);
  return next.length > 0 ? next.join('/') : null;
};

const venueStateOptionsForGeo = (areas: readonly DestinationPublicDTO[] = []) =>
  mergeVenueStateFilterOptionsWithDestinations(areas, 'AE');

export const geoStateToRegionKey = (
  node: GeoNodeLite,
  publishedDestinations: readonly DestinationPublicDTO[] = []
): string => {
  const name = node.n.trim().toLowerCase();
  const iso = node.iso?.trim().toLowerCase() ?? '';
  const slug = node.s.trim().toLowerCase();
  for (const option of venueStateOptionsForGeo(publishedDestinations)) {
    const key = option.key.toLowerCase();
    const label = option.label.toLowerCase();
    if (name === key || name === label || slug === key || slug === label) return option.key;
    if (iso && (iso === key || iso.endsWith(`-${key}`) || iso.includes(key.replace(/\s+/g, '')))) {
      return option.key;
    }
  }
  if (name.includes('ras al khaimah') || slug === 'rak' || iso.includes('rk')) return 'RAK';
  return node.n;
};

export const findGeoStateNodeForRegionKey = (
  regionKey: string,
  publishedDestinations: readonly DestinationPublicDTO[] = []
): GeoNodeLite | null => {
  const needle = regionKey.trim().toLowerCase();
  if (!needle) return null;
  const label = venueStateOptionsForGeo(publishedDestinations)
    .find((option) => option.key.toLowerCase() === needle)
    ?.label.toLowerCase();
  for (const node of geoStore.byId.values()) {
    if (node.kind !== 'state') continue;
    const name = node.n.toLowerCase();
    const slug = node.s.toLowerCase();
    const iso = node.iso?.toLowerCase() ?? '';
    if (name === needle || slug === needle || name === label || slug === label) return node;
    if (needle === 'rak' && (name.includes('ras al khaimah') || slug === 'rak' || iso.includes('rk'))) {
      return node;
    }
  }
  return null;
};

export const resolveBrowseGeoNode = (
  id: string,
  publishedDestinations: readonly DestinationPublicDTO[] = []
): GeoNodeLite | null =>
  geoStore.byId.get(id) ?? findGeoStateNodeForRegionKey(id, publishedDestinations);

export const browseGeoPathLabels = (
  ids: readonly string[],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): string[] =>
  ids
    .map((id) => resolveBrowseGeoNode(id, publishedDestinations))
    .filter((node): node is GeoNodeLite => node != null && node.kind !== 'country')
    .map((node) => node.n);

export const formatBrowseGeoPathLabel = (
  ids: readonly string[],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): string | null => {
  const labels = browseGeoPathLabels(ids, publishedDestinations);
  return labels.length > 0 ? labels.join(' → ') : null;
};

export const browseGeoChildKindLabel = (kind: GeoKind | undefined): string => {
  if (kind === 'country') return 'Emirates';
  if (kind === 'state') return 'Area';
  if (kind === 'area') return 'Venues';
  return 'Area';
};

export const resolveEffectiveBrowseVenueRegions = (
  venueRegions: readonly string[],
  geoPath: readonly string[],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): string[] => {
  if (venueRegions.length > 0) return [...venueRegions];
  return regionsFromBrowseGeoPath(geoPath, publishedDestinations);
};

export const regionsFromBrowseGeoPath = (
  ids: readonly string[],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): string[] => {
  for (const id of ids) {
    const node = resolveBrowseGeoNode(id, publishedDestinations);
    if (node?.kind === 'state') return [geoStateToRegionKey(node, publishedDestinations)];
    if (!node && venueStateOptionsForGeo(publishedDestinations).some((option) => option.key === id)) {
      return [id];
    }
  }
  return [];
};

export const exploreItemMatchesBrowseGeoPath = (
  item: ExploreMapItemDTO,
  geoIds: readonly string[],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): boolean => {
  if (geoIds.length === 0) return true;
  const leaf = geoIds[geoIds.length - 1]!;
  const chain = item.geoRef?.chain;
  const node = resolveBrowseGeoNode(leaf, publishedDestinations);
  if (chain?.includes(leaf) || (node && chain?.includes(node.id))) return true;
  if (node?.kind === 'country' && chain?.includes(node.id)) return true;
  if ((!node || node.kind === 'state') && geoIds.length === 1) {
    const regionKey = node ? geoStateToRegionKey(node, publishedDestinations) : leaf;
    return venueItemMatchesRegions(item, [regionKey]);
  }

  const names = item.geoRef?.names;
  if (node && names) {
    const n = node.n.trim().toLowerCase();
    if (node.kind === 'state' && names.state.trim().toLowerCase() === n) return true;
    if (node.kind === 'area' && names.area.trim().toLowerCase() === n) return true;
    if (node.kind === 'venue' && names.venue?.trim().toLowerCase() === n) return true;
  }
  return false;
};

export const BROWSE_GEO_LEAF_PLACE_TYPES = [
  { key: 'hiking', label: 'Trails' },
  { key: 'shop', label: 'Shops' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'others', label: 'Spots' },
  { key: 'camping', label: 'Other' },
] as const;
