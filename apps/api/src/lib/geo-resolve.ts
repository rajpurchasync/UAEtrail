import {
  GEO_COUNTRY_AE_ID,
  buildGeoSearchTokens,
  type GeoRef,
  type GeoRefNames,
} from '@uaetrail/shared-types';
import { distanceKm } from './geo-distance.js';
import {
  countryNode,
  findAreaNodeAtPoint,
  findStateNodeAtPoint,
  findVenueNodeAtPoint,
  findVenueNodeByName,
  loadGeoTree,
  otherAreaIdForState,
  type GeoTreeIndex,
} from './geo-tree.js';
import type { GeoNodeDoc } from '@uaetrail/shared-types';

const NEAREST_AREA_KM = 30;

export type GeoResolveHints = {
  latitude?: number | null;
  longitude?: number | null;
  destinationId?: string | null;
  countryCode?: string | null;
  region?: string | null;
  venueName?: string | null;
  extraNames?: string[];
};

const chainFromArea = (
  index: GeoTreeIndex,
  area: GeoNodeDoc,
  venue?: GeoNodeDoc | null
): GeoNodeDoc[] => {
  const nodes: GeoNodeDoc[] = [];
  for (const id of area.ancestors) {
    const n = index.byId.get(id);
    if (n) nodes.push(n);
  }
  nodes.push(area);
  if (venue) nodes.push(venue);
  return nodes;
};

const resolveVenueForArea = (
  index: GeoTreeIndex,
  area: GeoNodeDoc,
  hints: GeoResolveHints
): GeoNodeDoc | null => {
  const lat = hints.latitude;
  const lng = hints.longitude;
  if (lat != null && lng != null) {
    const atPoint = findVenueNodeAtPoint(index, lat, lng, String(area._id));
    if (atPoint) return atPoint;
  }
  return findVenueNodeByName(index, String(area._id), hints.venueName);
};

const namesFromChain = (nodes: GeoNodeDoc[], venueName?: string | null): GeoRefNames => {
  const byKind = (kind: string) => nodes.find((n) => n.kind === kind)?.names.en ?? '';
  return {
    country: byKind('country') || 'United Arab Emirates',
    state: byKind('state'),
    area: byKind('area'),
    ...(venueName?.trim() ? { venue: venueName.trim() } : {}),
  };
};

const toGeoRef = (nodes: GeoNodeDoc[], venueName?: string | null, extra: string[] = []): GeoRef => {
  const area = nodes.find((n) => n.kind === 'area') ?? nodes[nodes.length - 1];
  const country = nodes.find((n) => n.kind === 'country');
  const state = nodes.find((n) => n.kind === 'state');
  const venue = nodes.find((n) => n.kind === 'venue');
  const names = namesFromChain(nodes, venueName ?? venue?.names.en);
  const chain = nodes.map((n) => String(n._id));
  return {
    chain,
    countryId: String(country?._id ?? GEO_COUNTRY_AE_ID),
    stateId: String(state?._id ?? ''),
    areaId: String(area?._id ?? ''),
    ...(venue ? { venueId: String(venue._id) } : {}),
    path: (venue ?? area)?.path ?? nodes[nodes.length - 1]?.path ?? 'ae',
    names,
    searchTokens: buildGeoSearchTokens(names, extra),
  };
};

const nearestArea = (index: GeoTreeIndex, lat: number, lng: number): GeoNodeDoc | null => {
  let best: GeoNodeDoc | null = null;
  let bestKm = NEAREST_AREA_KM;
  for (const area of index.areas) {
    if (area.slug === 'other') continue;
    const [alng, alat] = area.center.coordinates;
    const km = distanceKm(lat, lng, alat, alng);
    if (km < bestKm) {
      bestKm = km;
      best = area;
    }
  }
  return best;
};

export type GeoResolveResult = { geoRef: GeoRef; needsReview: boolean };

export const resolveGeoRefFromTree = (
  index: GeoTreeIndex,
  hints: GeoResolveHints
): GeoResolveResult => {
  const extra = hints.extraNames ?? [];
  const venueName = hints.venueName ?? null;
  if (hints.destinationId) {
    const byCatalog = [...index.byId.values()].find(
      (n) => n.catalogDestinationId === hints.destinationId || String(n._id) === hints.destinationId
    );
    if (byCatalog?.kind === 'area') {
      const venue = resolveVenueForArea(index, byCatalog, hints);
      return {
        geoRef: toGeoRef(chainFromArea(index, byCatalog, venue), venueName, extra),
        needsReview: false,
      };
    }
  }

  const lat = hints.latitude;
  const lng = hints.longitude;
  if (lat != null && lng != null) {
    const pip = findAreaNodeAtPoint(index, lat, lng);
    if (pip) {
      const venue = resolveVenueForArea(index, pip, hints);
      return { geoRef: toGeoRef(chainFromArea(index, pip, venue), venueName, extra), needsReview: false };
    }
    const near = nearestArea(index, lat, lng);
    if (near) {
      const venue = resolveVenueForArea(index, near, hints);
      return { geoRef: toGeoRef(chainFromArea(index, near, venue), venueName, extra), needsReview: true };
    }
    const state = findStateNodeAtPoint(index, lat, lng);
    if (state) {
      const other = index.byId.get(otherAreaIdForState(String(state._id)));
      if (other) {
        const venue = resolveVenueForArea(index, other, hints);
        return {
          geoRef: toGeoRef(chainFromArea(index, other, venue), venueName, extra),
          needsReview: true,
        };
      }
    }
  }

  const country = countryNode(index);
  const regionKey = hints.region?.trim().toLowerCase();
  const regionAliases =
    regionKey === 'al ain' || regionKey === 'alain' || regionKey === 'al-ain'
      ? ['abu dhabi', 'abu-dhabi']
      : [];
  const state =
    (regionKey
      ? index.states.find(
          (s) =>
            s.slug === regionKey ||
            s.names.en.toLowerCase() === regionKey ||
            s.names.en.toLowerCase().includes(regionKey) ||
            regionAliases.includes(s.slug) ||
            regionAliases.includes(s.names.en.toLowerCase())
        )
      : null) ?? index.states[0] ?? null;
  if (country && state) {
    const other = index.byId.get(otherAreaIdForState(String(state._id))) ?? null;
    const nodes = [country, state, ...(other ? [other] : [])];
    return { geoRef: toGeoRef(nodes, venueName, extra), needsReview: true };
  }

  const fallbackNames: GeoRefNames = {
    country: 'United Arab Emirates',
    state: hints.region?.trim() || 'Unknown',
    area: 'Other',
    ...(venueName ? { venue: venueName } : {}),
  };
  return {
    geoRef: {
      chain: [GEO_COUNTRY_AE_ID],
      countryId: GEO_COUNTRY_AE_ID,
      stateId: '',
      areaId: '',
      path: 'ae',
      names: fallbackNames,
      searchTokens: buildGeoSearchTokens(fallbackNames, extra),
    },
    needsReview: true,
  };
};

export const resolveGeoRefForPin = async (hints: GeoResolveHints): Promise<GeoResolveResult> => {
  const index = await loadGeoTree();
  return resolveGeoRefFromTree(index, hints);
};
