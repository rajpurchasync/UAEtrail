/**
 * Geographic hierarchy (detail-pages plan §18) — UUID/string ids, not ObjectId.
 * Tree: country → state → area → optional venue.
 * Places/events live under area (and venue when present).
 * Facilities are tagged to a place (`parentPlaceId`) and/or venue (`venueId` / `geoRef.venueId`)
 * — they are not a geo-tree level.
 */

export type GeoLevel = 1 | 2 | 3 | 4;
export type GeoKind = 'country' | 'state' | 'area' | 'venue';
export type GeoNodeStatus = 'active' | 'hidden';

export type GeoPointWire = { type: 'Point'; coordinates: [lng: number, lat: number] };

export type GeoRefNames = {
  country: string;
  state: string;
  area: string;
  venue?: string;
};

/** Chain of node ids + denormalised names for indexed search. */
export type GeoRef = {
  chain: string[];
  countryId: string;
  stateId: string;
  areaId: string;
  venueId?: string;
  path: string;
  names: GeoRefNames;
  /** Lowercased names and tokens — multikey equality search. */
  searchTokens: string[];
};

export type GeoNodeDoc = {
  _id: string;
  level: GeoLevel;
  kind: GeoKind;
  slug: string;
  path: string;
  names: { en: string; ar?: string };
  parentId?: string;
  ancestors: string[];
  center: GeoPointWire;
  bbox: [minLng: number, minLat: number, maxLng: number, maxLat: number];
  geometry?: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
  radiusM?: number;
  childCount: number;
  sort: number;
  status: GeoNodeStatus;
  isoCode?: string;
  /** Curated `destinations` row id when this geo node mirrors a Destination hub. */
  catalogDestinationId?: string;
  dedupe?: DedupeKeys;
  aliases?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type GeoStatsScope = GeoKind | 'point';

export type GeoStatsDoc = {
  _id: string;
  scope: GeoStatsScope;
  facilities: Partial<Record<string, number>>;
  places: Partial<Record<string, number>>;
  activeActivities: Partial<Record<string, number>>;
  rev: number;
  updatedAt: Date | string;
  batches: string[];
};

export type GeoOutboxDoc = {
  _id: string;
  scope: string;
  inc: Record<string, number>;
  at: Date | string;
  batch?: string;
};

export type GeoMetaDoc = {
  _id: string;
  treeVersion: number;
  updatedAt: Date | string;
};

export type GeoNodeLite = {
  id: string;
  p: string | null;
  l: GeoLevel;
  s: string;
  n: string;
  a?: string;
  c: [number, number];
  path: string;
  kind: GeoKind;
  iso?: string;
};

export type GeoTreeDTO = {
  version: number;
  nodes: GeoNodeLite[];
};

export type GeoCountsDTO = {
  fac?: Record<string, number>;
  pl?: Record<string, number>;
  act?: Record<string, number>;
};

export type GeoSummaryDTO = {
  node: GeoNodeLite;
  breadcrumbs: GeoNodeLite[];
  counts: GeoCountsDTO;
  children: Array<GeoNodeLite & { counts: GeoCountsDTO }>;
  rev: number;
};

export type DedupeKeys = {
  nameKey: string;
  cells: string[];
  phoneKey?: string;
  domainKey?: string;
  routeKey?: string;
};

export const GEO_COUNTRY_AE_ID = 'geo-country-ae';
export const GEO_STATE_AE_ABU_DHABI_ID = 'geo-state-ae-abu-dhabi';
/** Canonical Al Ain city node — area under Abu Dhabi, not an emirate. */
export const GEO_AREA_AE_AL_AIN_ID = 'geo-area-ae-abu-dhabi-al-ain';
/** Pre-taxonomy Al Ain-as-emirate id. Hidden after backfill; public URLs still resolve. */
export const GEO_LEGACY_STATE_AE_AL_AIN_ID = 'geo-state-ae-al-ain';
export const GEO_LEGACY_AREA_OTHER_AL_AIN_ID = `geo-area-other-${GEO_LEGACY_STATE_AE_AL_AIN_ID}`;

/** Old node ids / paths → canonical Al Ain area. */
export const GEO_NODE_ID_ALIASES: Record<string, string> = {
  [GEO_LEGACY_STATE_AE_AL_AIN_ID]: GEO_AREA_AE_AL_AIN_ID,
  [GEO_LEGACY_AREA_OTHER_AL_AIN_ID]: GEO_AREA_AE_AL_AIN_ID,
  'ae/al-ain': GEO_AREA_AE_AL_AIN_ID,
};

export const canonicalGeoNodeId = (idOrPath: string): string =>
  GEO_NODE_ID_ALIASES[idOrPath] ?? idOrPath;

export const tokenizeGeoSearchText = (...parts: Array<string | null | undefined>): string[] => {
  const tokens = new Set<string>();
  for (const part of parts) {
    const raw = part?.trim().toLowerCase();
    if (!raw) continue;
    tokens.add(raw);
    for (const word of raw.split(/[^a-z0-9\u0600-\u06ff]+/)) {
      if (word.length >= 2) tokens.add(word);
    }
  }
  return [...tokens];
};

export const buildGeoSearchTokens = (names: GeoRefNames, extra: string[] = []): string[] =>
  tokenizeGeoSearchText(names.country, names.state, names.area, names.venue, ...extra);

export const geoRefMatchesQuery = (geoRef: GeoRef | null | undefined, query: string): boolean => {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q || !geoRef) return false;
  if (geoRef.searchTokens.some((t) => t === q || t.startsWith(q) || q.startsWith(t))) return true;
  const hay = [geoRef.path, geoRef.names.country, geoRef.names.state, geoRef.names.area, geoRef.names.venue]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
};

export const exploreGeoQueryTokens = (query: string): string[] =>
  tokenizeGeoSearchText(query).filter((t) => t.length >= 2);
