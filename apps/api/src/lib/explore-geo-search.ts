import {
  exploreGeoQueryTokens,
  exploreMapItemMatchesDestinationSlug,
  geoRefMatchesQuery,
  resolveExploreDestinationSlugQuery,
  type ExploreMapItemDTO,
  type GeoRef,
} from '@uaetrail/shared-types';
import type { Filter } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { findDestinationBySlug } from './destinations-store.js';
import { loadGeoTree } from './geo-tree.js';

/** AdminGeo text search — never treat curated `destination` as a geo node slug. */
export type AdminGeoSearchQuery = {
  q?: string;
  country?: string;
  venue?: string;
};

export type ExploreGeoSearchQuery = AdminGeoSearchQuery & {
  /** Curated hub slug — matches catalog `destinationId`, not `geo_nodes`. */
  destination?: string;
};

const itemGeoRef = (item: ExploreMapItemDTO): GeoRef | null =>
  item.geoRef ?? item.activity?.geoRef ?? null;

export const exploreMapItemMatchesGeoSearch = (
  item: ExploreMapItemDTO,
  query: ExploreGeoSearchQuery
): boolean => {
  const destinationSlug = resolveExploreDestinationSlugQuery(query) ?? '';
  if (destinationSlug && !exploreMapItemMatchesDestinationSlug(item, destinationSlug)) {
    return false;
  }

  const q = query.q?.trim() ?? '';
  const country = query.country?.trim() ?? '';
  const venue = query.venue?.trim() ?? '';
  if (!q && !country && !venue) return true;

  const ref = itemGeoRef(item);
  const hay = [
    item.title,
    item.subtitle,
    item.placeHubLabel,
    item.locationCard?.region,
    item.activity?.locationName,
    item.activity?.region,
    ref?.names.country,
    ref?.names.state,
    ref?.names.area,
    ref?.names.venue,
    ref?.path,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchNamed = (needle: string): boolean => {
    if (!needle) return true;
    const n = needle.toLowerCase();
    if (ref && geoRefMatchesQuery(ref, n)) return true;
    return hay.includes(n);
  };

  if (country && !matchNamed(country)) return false;
  if (venue && !matchNamed(venue)) return false;
  if (q && !matchNamed(q)) return false;
  return true;
};

export const filterExploreMapItemsByGeoSearch = (
  items: ExploreMapItemDTO[],
  query: ExploreGeoSearchQuery
): ExploreMapItemDTO[] => {
  const destinationSlug = resolveExploreDestinationSlugQuery(query);
  const hasAdminGeo = Boolean(
    query.q?.trim() || query.country?.trim() || query.venue?.trim()
  );
  if (!hasAdminGeo && !destinationSlug) return items;
  return items.filter((item) => exploreMapItemMatchesGeoSearch(item, query));
};

export const mongoGeoSearchFilter = async (
  query: AdminGeoSearchQuery
): Promise<Filter<Document> | null> => {
  const clauses: Filter<Document>[] = [];
  const tokens = exploreGeoQueryTokens(query.q ?? '');
  if (tokens.length) {
    clauses.push({ 'geoRef.searchTokens': { $all: tokens.slice(0, 6) } });
  }
  const tree = await loadGeoTree();
  const named = [
    { raw: query.country, kinds: ['country'] as const },
    { raw: query.venue, kinds: ['venue', 'area'] as const },
  ];
  for (const { raw, kinds } of named) {
    const v = raw?.trim().toLowerCase();
    if (!v) continue;
    const node = [...tree.byId.values()].find(
      (n) =>
        (kinds as readonly string[]).includes(n.kind) &&
        (n.slug === v || n.names.en.toLowerCase() === v || n.path === v || String(n._id) === raw)
    );
    if (node) clauses.push({ 'geoRef.chain': String(node._id) });
    else clauses.push({ 'geoRef.searchTokens': v });
  }
  if (clauses.length === 0) return null;
  return clauses.length === 1 ? clauses[0]! : { $and: clauses };
};

/** Curated destination slug → `destinationId` equality on catalog rows. */
export const mongoCatalogDestinationFilter = async (
  destinationSlug: string | null | undefined
): Promise<Filter<Document> | null> => {
  const slug = resolveExploreDestinationSlugQuery({ destination: destinationSlug });
  if (!slug) return null;
  const row = await findDestinationBySlug(slug);
  if (!row) return { destinationId: { $in: [] as string[] } };
  return { destinationId: row.id };
};

const locationGeoSearchFilter = async (
  query: ExploreGeoSearchQuery
): Promise<Filter<Document> | null> => {
  const adminFilter = await mongoGeoSearchFilter(query);
  const catalogFilter = await mongoCatalogDestinationFilter(query.destination);
  const parts = [adminFilter, catalogFilter].filter(Boolean) as Filter<Document>[];
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0]! : { $and: parts };
};

/** Activities inherit catalog destination via `locationId` → place row (no `activities.destinationId`). */
export const mongoActivityGeoSearchFilter = async (
  query: ExploreGeoSearchQuery,
  locationIdsInDestination: string[] | null
): Promise<Filter<Document> | null> => {
  const adminFilter = await mongoGeoSearchFilter(query);
  const destinationSlug = resolveExploreDestinationSlugQuery(query);
  if (!adminFilter && !destinationSlug) return null;

  if (destinationSlug) {
    if (!locationIdsInDestination?.length) {
      return { locationId: { $in: [] as string[] } } as unknown as Filter<Document>;
    }
    const byPlace = { locationId: { $in: locationIdsInDestination } } as unknown as Filter<Document>;
    return adminFilter ? { $and: [byPlace, adminFilter] } : byPlace;
  }

  return adminFilter;
};

export const findPinIdsMatchingGeoSearch = async (
  query: ExploreGeoSearchQuery,
  limit = 400
): Promise<{ locationIds: string[]; activityIds: string[]; facilityIds: string[] }> => {
  const locationFilter = await locationGeoSearchFilter(query);
  if (!locationFilter) {
    return { locationIds: [], activityIds: [], facilityIds: [] };
  }

  const db = getMongoClient()!.db();
  const catalogFilter = await mongoCatalogDestinationFilter(query.destination);
  let locationIdsForActivities: string[] | null = null;
  if (catalogFilter) {
    const destPlaces = await db
      .collection(COLLECTIONS.LOCATIONS)
      .find(catalogFilter as never)
      .project({ _id: 1 })
      .limit(limit)
      .toArray();
    locationIdsForActivities = destPlaces.map((d) => String(d._id));
  }

  const activityFilter = await mongoActivityGeoSearchFilter(query, locationIdsForActivities);

  const [locations, facilities, activities] = await Promise.all([
    db.collection(COLLECTIONS.LOCATIONS).find(locationFilter as never).project({ _id: 1 }).limit(limit).toArray(),
    db.collection(COLLECTIONS.FACILITIES).find(locationFilter as never).project({ _id: 1 }).limit(limit).toArray(),
    activityFilter
      ? db.collection(COLLECTIONS.ACTIVITIES).find(activityFilter as never).project({ _id: 1 }).limit(limit).toArray()
      : Promise.resolve([]),
  ]);
  return {
    locationIds: locations.map((d) => String(d._id)),
    activityIds: activities.map((d) => String(d._id)),
    facilityIds: facilities.map((d) => String(d._id)),
  };
};