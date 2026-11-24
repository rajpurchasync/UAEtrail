/**
 * Place catalog destination index — organize-picker ladder only (`GET /places/catalog`).
 *
 * **Product tree (host “where” step):**
 * - **Area** — curated map region (Hatta, Jebel Jais, …)
 * - **Place hub** — named bucket under an area (e.g. Wadi Shawka); today `areaLabel` / `areaName`
 *   on leaf rows until dedicated hub rows + `parentPlaceId` ship on place catalog rows
 * - **Catalog leaf** — one row you host on: trail (`hiking`), camp spot (`camping`), event venue (`event`)
 *
 * **Facilities** (toilet, parking, …) live in `facilities` with optional `parentPlaceId` — they are
 * **not** in this index and are not activity destinations here (see `FacilityCatalogQuery`).
 *
 * Pure catalog + areas read model (no hosting / activity draft imports).
 */
import { normalizeGroupRegionLabel } from '@uaetrail/shared-types';
import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import {
  DEFAULT_COUNTRY,
  getSubdivisionOptionsForCountry,
  mergeVenueStateFilterOptionsWithAreas,
  SUPPORTED_COUNTRIES,
  type CountryCode,
  type CountrySubdivisionOption,
} from '../config/regions';
import { EXPLORE_EMIRATE_REGION_ALIASES } from '../config/exploreRegionAliases';
import { normalizeVenueRegionToken } from '../utils/venueRegionFilter';

export const DEFAULT_PLACE_CATALOG_COUNTRY: CountryCode = DEFAULT_COUNTRY;

const SUPPORTED_COUNTRY_CODES = new Set<CountryCode>(
  SUPPORTED_COUNTRIES.map((row) => row.code)
);

export const resolvePlaceCatalogCountryCode = (
  raw: string | null | undefined,
  fallback: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): CountryCode => {
  const code = raw?.trim().toUpperCase();
  if (code && SUPPORTED_COUNTRY_CODES.has(code as CountryCode)) {
    return code as CountryCode;
  }
  return fallback;
};

export const placeRowInCatalogCountry = (
  place: Pick<PlaceDTO, 'countryCode'>,
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): boolean => resolvePlaceCatalogCountryCode(place.countryCode) === countryCode;

export const areaRowInCatalogCountry = (
  area: Pick<AreaPublicDTO, 'countryCode'>,
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): boolean => resolvePlaceCatalogCountryCode(area.countryCode) === countryCode;

export const scopePlaceCatalogDestination = (
  places: PlaceDTO[],
  areas: AreaPublicDTO[],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): { places: PlaceDTO[]; areas: AreaPublicDTO[] } => ({
  places: places.filter((place) => placeRowInCatalogCountry(place, countryCode)),
  areas: areas.filter((area) => areaRowInCatalogCountry(area, countryCode)),
});

/** Parent place ids referenced by catalog leaf rows (`parentPlaceId`). */
export const collectPlaceCatalogParentHubIds = (places: PlaceDTO[]): Set<string> => {
  const ids = new Set<string>();
  for (const row of places) {
    const parent = row.parentPlaceId?.trim();
    if (parent) ids.add(parent);
  }
  return ids;
};

/**
 * Place hub key — groups catalog leaf rows (trail, camp, venue).
 * Prefer `parentPlaceId` when set on the row (CPC hub id); parent hub rows use their own id.
 */
export const placeCatalogPlaceGroupKey = (
  place: PlaceDTO,
  parentHubIds: Set<string> = new Set()
): string => {
  const parent = place.parentPlaceId?.trim();
  if (parent) return parent;
  if (parentHubIds.has(place.id)) return place.id;
  return place.areaLabel?.trim() || place.destinationName?.trim() || '__main__';
};

export const placeCatalogRowIsParentHub = (
  place: PlaceDTO,
  parentHubIds: Set<string>
): boolean => !place.parentPlaceId?.trim() && parentHubIds.has(place.id);

/** Rows selectable as host destination (excludes parent-only hubs and anchor-only rows). */
export const placeCatalogRowIsHostingLeaf = (
  place: PlaceDTO,
  parentHubIds: Set<string>
): boolean => {
  if (place.publicationStatus === 'anchor_only') return false;
  if (placeCatalogRowIsParentHub(place, parentHubIds)) return false;
  return true;
};

const EARTH_METERS = 6_371_000;

const catalogLeafDistanceMeters = (
  fromLat: number,
  fromLng: number,
  lat: number,
  lng: number
): number => {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat - fromLat);
  const dLng = toRad(lng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** Snap radius when a host drops a destination pin on the map. */
export const PLACE_CATALOG_MAP_SNAP_METERS = 2500;

/** Nearest hosting leaf to a map pin, or null if nothing is within {@link PLACE_CATALOG_MAP_SNAP_METERS}. */
export const nearestPlaceCatalogHostingLeaf = (
  lat: number,
  lng: number,
  places: PlaceDTO[],
  maxMeters = PLACE_CATALOG_MAP_SNAP_METERS
): PlaceDTO | null => {
  const parentHubIds = collectPlaceCatalogParentHubIds(places);
  let best: PlaceDTO | null = null;
  let bestMeters = maxMeters;
  for (const place of places) {
    if (!placeCatalogRowIsHostingLeaf(place, parentHubIds)) continue;
    if (place.latitude == null || place.longitude == null) continue;
    const meters = catalogLeafDistanceMeters(lat, lng, place.latitude, place.longitude);
    if (meters <= bestMeters) {
      bestMeters = meters;
      best = place;
    }
  }
  return best;
};

/** Label for a place hub bucket in the ladder (resolve hub name when `parentPlaceId` is set). */
export const placeCatalogPlaceGroupLabelFromHub = (
  places: PlaceDTO[],
  groupKey: string
): string => {
  const hubRow = places.find((row) => row.id === groupKey);
  if (hubRow) return hubRow.name.trim();
  const parentHubIds = collectPlaceCatalogParentHubIds(places);
  const sample = places.find((row) => placeCatalogPlaceGroupKey(row, parentHubIds) === groupKey);
  return sample ? placeCatalogPlaceGroupLabel(sample) : groupKey;
};

export const placeCatalogPlaceGroupLabel = (place: PlaceDTO): string => {
  const label = place.areaLabel?.trim() || place.destinationName?.trim();
  return label || 'Main trails';
};

export const placeCatalogSubdivisionMatchesState = (
  rawRegion: string | null | undefined,
  stateKey: string,
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): boolean => {
  if (!rawRegion?.trim() || !stateKey.trim()) return false;
  if (countryCode === 'AE') {
    const catalog = normalizeGroupRegionLabel(rawRegion);
    if (catalog && placeCatalogRegionsMatch(catalog, stateKey)) return true;
  }
  return placeCatalogRegionsMatch(rawRegion, stateKey);
};

export const placeCatalogRegionsMatch = (left: string, right: string): boolean => {
  const a = normalizeVenueRegionToken(left);
  const b = normalizeVenueRegionToken(right);
  if (!a || !b) return false;
  if (a === b) return true;
  for (const [canonical, aliases] of Object.entries(EXPLORE_EMIRATE_REGION_ALIASES)) {
    const bucket = new Set([
      normalizeVenueRegionToken(canonical),
      ...aliases.map((alias) => normalizeVenueRegionToken(alias)),
    ]);
    if (bucket.has(a) && bucket.has(b)) return true;
  }
  return false;
};

export const resolvePlaceCatalogAreaForRow = (
  place: PlaceDTO,
  areas: AreaPublicDTO[]
): AreaPublicDTO | null => {
  const destinationId = place.destinationId?.trim();
  if (destinationId) {
    const hit = areas.find((area) => area.id === destinationId);
    if (hit) return hit;
  }
  return (
    areas.find(
      (area) => place.region?.trim() && placeCatalogRegionsMatch(area.region, place.region)
    ) ?? null
  );
};

export const placeCatalogRowBelongsToArea = (
  place: PlaceDTO,
  area: AreaPublicDTO,
  areas: AreaPublicDTO[]
): boolean => {
  const linked = resolvePlaceCatalogAreaForRow(place, areas);
  return linked?.id === area.id;
};

export const buildPlaceCatalogStateOptions = (
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY,
  areas: readonly AreaPublicDTO[] = []
): CountrySubdivisionOption[] => {
  if (countryCode === 'AE') {
    return mergeVenueStateFilterOptionsWithAreas(areas, countryCode).map((row) => ({
      value: row.key,
      label: row.label,
    }));
  }
  return getSubdivisionOptionsForCountry(countryCode);
};

export const buildPlaceCatalogAreaOptions = (
  places: PlaceDTO[],
  areas: AreaPublicDTO[],
  state: string,
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): AreaPublicDTO[] => {
  if (!state.trim()) return [];
  const scoped = scopePlaceCatalogDestination(places, areas, countryCode);
  return scoped.areas
    .filter((area) => placeCatalogSubdivisionMatchesState(area.region, state, countryCode))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const filterPlaceCatalogRowsInArea = (
  places: PlaceDTO[],
  area: AreaPublicDTO,
  areas: AreaPublicDTO[]
): PlaceDTO[] =>
  places
    .filter((place) => placeCatalogRowBelongsToArea(place, area, areas))
    .sort((a, b) => a.name.localeCompare(b.name));

export const buildPlaceCatalogPlaceGroupOptions = (
  places: PlaceDTO[]
): Array<{ key: string; label: string }> => {
  const parentHubIds = collectPlaceCatalogParentHubIds(places);
  const byKey = new Map<string, string>();
  for (const place of places) {
    const key = placeCatalogPlaceGroupKey(place, parentHubIds);
    if (!byKey.has(key)) byKey.set(key, placeCatalogPlaceGroupLabelFromHub(places, key));
  }
  return [...byKey.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/** Catalog leaf rows under a place hub (trails, camps, event venues — same {@link PlaceDTO} storage). */
export const filterPlaceCatalogTrailRowsInGroup = (
  places: PlaceDTO[],
  groupKey: string,
  catalogScope?: PlaceDTO[]
): PlaceDTO[] => {
  const scope = catalogScope ?? places;
  const parentHubIds = collectPlaceCatalogParentHubIds(scope);
  return places
    .filter(
      (place) =>
        placeCatalogPlaceGroupKey(place, parentHubIds) === groupKey &&
        placeCatalogRowIsHostingLeaf(place, parentHubIds)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const resolvePlaceCatalogStateKeyForRow = (
  place: PlaceDTO,
  areas: AreaPublicDTO[],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): string => {
  const area = resolvePlaceCatalogAreaForRow(place, areas);
  const raw = area?.region ?? place.region;
  if (countryCode === 'AE') {
    const catalog = normalizeGroupRegionLabel(raw);
    if (catalog) return catalog;
  }
  const options = buildPlaceCatalogStateOptions(countryCode, areas);
  const hit = options.find((option) =>
    placeCatalogSubdivisionMatchesState(raw, option.value, countryCode)
  );
  return hit?.value ?? raw?.trim() ?? '';
};

export const inferPlaceCatalogLadderFromRow = (
  place: PlaceDTO,
  areas: AreaPublicDTO[],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY,
  catalogPlaces?: PlaceDTO[]
): { state: string; destinationId: string; placeGroup: string } => {
  const area = resolvePlaceCatalogAreaForRow(place, areas);
  const parentHubIds = collectPlaceCatalogParentHubIds(catalogPlaces ?? [place]);
  return {
    state: resolvePlaceCatalogStateKeyForRow(place, areas, countryCode),
    destinationId: area?.id ?? '',
    placeGroup: placeCatalogPlaceGroupKey(place, parentHubIds),
  };
};

export const resolvePlaceCatalogStateFromArea = (
  area: AreaPublicDTO,
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY,
  areas: readonly AreaPublicDTO[] = []
): string => {
  const raw = area.region;
  if (countryCode === 'AE') {
    const catalog = normalizeGroupRegionLabel(raw);
    if (catalog) return catalog;
  }
  const catalogAreas = areas.length > 0 ? areas : [area];
  const options = buildPlaceCatalogStateOptions(countryCode, catalogAreas);
  const hit = options.find((option) =>
    placeCatalogSubdivisionMatchesState(raw, option.value, countryCode)
  );
  return hit?.value ?? raw?.trim() ?? '';
};

export const placeCatalogPlaceGroupLabelForKey = (
  places: PlaceDTO[],
  groupKey: string
): string => placeCatalogPlaceGroupLabelFromHub(places, groupKey);

/** Search hit for a single catalog leaf row (trail / camp / venue), not a facility. */
export type PlaceCatalogDestinationSearchTrailHit = {
  kind: 'trail';
  placeId: string;
  title: string;
  subtitle: string;
};

export type PlaceCatalogDestinationSearchPlaceHit = {
  kind: 'place';
  placeGroupKey: string;
  title: string;
  subtitle: string;
  state: string;
  destinationId: string;
  trailCount: number;
};

export type PlaceCatalogDestinationSearchAreaHit = {
  kind: 'area';
  destinationId: string;
  title: string;
  subtitle: string;
  placeCount: number;
};

export type PlaceCatalogDestinationSearchHit =
  | PlaceCatalogDestinationSearchTrailHit
  | PlaceCatalogDestinationSearchPlaceHit
  | PlaceCatalogDestinationSearchAreaHit;

const normalizeSearchToken = (value: string): string => value.trim().toLowerCase();

const searchMatches = (haystack: string | null | undefined, needle: string): boolean => {
  const h = normalizeSearchToken(haystack ?? '');
  const n = normalizeSearchToken(needle);
  if (!h || !n) return false;
  return h.includes(n);
};

const trailSearchSubtitle = (place: PlaceDTO, areas: AreaPublicDTO[]): string => {
  const area = resolvePlaceCatalogAreaForRow(place, areas);
  const placeLabel = placeCatalogPlaceGroupLabel(place);
  const parts = [place.name, placeLabel, area?.name, area?.region ?? place.region].filter(Boolean);
  return [...new Set(parts)].slice(0, 3).join(' · ');
};

export type PlaceCatalogDestinationSearchScope = {
  state?: string;
  destinationId?: string;
  limitPerGroup?: number;
};

export const searchPlaceCatalogDestination = (
  query: string,
  places: PlaceDTO[],
  areas: AreaPublicDTO[],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY,
  scope: PlaceCatalogDestinationSearchScope = {}
): PlaceCatalogDestinationSearchHit[] => {
  const q = query.trim();
  if (q.length < 2) return [];

  const limitPerGroup = scope.limitPerGroup ?? 8;
  const scoped = scopePlaceCatalogDestination(places, areas, countryCode);
  let catalogPlaces = scoped.places;
  let catalogAreas = scoped.areas;
  if (scope.destinationId?.trim()) {
    catalogAreas = catalogAreas.filter((row) => row.id === scope.destinationId);
    const area = catalogAreas[0];
    catalogPlaces = area
      ? filterPlaceCatalogRowsInArea(catalogPlaces, area, scoped.areas)
      : [];
  } else if (scope.state?.trim()) {
    catalogAreas = catalogAreas.filter(
      (row) => resolvePlaceCatalogStateFromArea(row, countryCode, scoped.areas) === scope.state
    );
    const areaIds = new Set(catalogAreas.map((row) => row.id));
    catalogPlaces = catalogPlaces.filter((place) => {
      const area = resolvePlaceCatalogAreaForRow(place, scoped.areas);
      return Boolean(area && areaIds.has(area.id));
    });
  }
  const parentHubIds = collectPlaceCatalogParentHubIds(catalogPlaces);
  const trails: PlaceCatalogDestinationSearchTrailHit[] = [];
  const placeHits: PlaceCatalogDestinationSearchPlaceHit[] = [];
  const areaHits: PlaceCatalogDestinationSearchAreaHit[] = [];

  for (const place of catalogPlaces) {
    if (!placeCatalogRowIsHostingLeaf(place, parentHubIds)) continue;
    if (!searchMatches(place.name, q)) continue;
    trails.push({
      kind: 'trail',
      placeId: place.id,
      title: place.name,
      subtitle: trailSearchSubtitle(place, scoped.areas),
    });
  }

  const seenPlaceGroups = new Set<string>();
  for (const area of catalogAreas) {
    const inArea = filterPlaceCatalogRowsInArea(catalogPlaces, area, scoped.areas);
    const groups = buildPlaceCatalogPlaceGroupOptions(inArea);
    for (const group of groups) {
      const key = `${area.id}::${group.key}`;
      if (seenPlaceGroups.has(key)) continue;
      const labelMatch = searchMatches(group.label, q);
      const trailsInGroup = filterPlaceCatalogTrailRowsInGroup(
        inArea,
        group.key,
        catalogPlaces
      );
      const trailNameMatch = trailsInGroup.some((row) => searchMatches(row.name, q));
      if (!labelMatch && !trailNameMatch) continue;
      seenPlaceGroups.add(key);
      const sample = trailsInGroup[0];
      const state = sample
        ? inferPlaceCatalogLadderFromRow(sample, scoped.areas, countryCode, catalogPlaces).state
        : resolvePlaceCatalogStateFromArea(area, countryCode, scoped.areas);
      placeHits.push({
        kind: 'place',
        placeGroupKey: group.key,
        title: group.label,
        subtitle: `${area.name} · ${state}`,
        state,
        destinationId: area.id,
        trailCount: trailsInGroup.length,
      });
    }
  }

  for (const area of catalogAreas) {
    if (!searchMatches(area.name, q) && !searchMatches(area.region, q)) continue;
    const inArea = filterPlaceCatalogRowsInArea(catalogPlaces, area, scoped.areas);
    const placeCount = buildPlaceCatalogPlaceGroupOptions(inArea).length;
    areaHits.push({
      kind: 'area',
      destinationId: area.id,
      title: area.name,
      subtitle: area.region,
      placeCount,
    });
  }

  const sortByTitle = <T extends { title: string }>(rows: T[]): T[] =>
    rows.sort((a, b) => a.title.localeCompare(b.title));

  return [
    ...sortByTitle(trails).slice(0, limitPerGroup),
    ...sortByTitle(placeHits).slice(0, limitPerGroup),
    ...sortByTitle(areaHits).slice(0, limitPerGroup),
  ];
};
