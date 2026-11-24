import {
  exploreGeoQueryTokens,
  geoRefMatchesQuery,
  resolveExploreDestinationSlugQuery,
  type ExploreMapItemDTO,
  type GeoRef,
} from '@uaetrail/shared-types';
import type { Filter } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { loadGeoTree } from './geo-tree.js';

export type ExploreGeoSearchQuery = {
  q?: string;
  country?: string;
  area?: string;
  destination?: string;
  venue?: string;
};

const itemGeoRef = (item: ExploreMapItemDTO): GeoRef | null =>
  item.geoRef ?? item.activity?.geoRef ?? null;

export const exploreMapItemMatchesGeoSearch = (
  item: ExploreMapItemDTO,
  query: ExploreGeoSearchQuery
): boolean => {
  const q = query.q?.trim() ?? '';
  const country = query.country?.trim() ?? '';
  const area = resolveExploreDestinationSlugQuery(query) ?? '';
  const venue = query.venue?.trim() ?? '';
  if (!q && !country && !area && !venue) return true;

  const ref = itemGeoRef(item);
  const hay = [
    item.title,
    item.subtitle,
    item.destinationName,
    item.areaLabel,
    item.destinationSlug,
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
  if (area && !matchNamed(area)) return false;
  if (venue && !matchNamed(venue)) return false;
  if (q && !matchNamed(q)) return false;
  return true;
};

export const filterExploreMapItemsByGeoSearch = (
  items: ExploreMapItemDTO[],
  query: ExploreGeoSearchQuery
): ExploreMapItemDTO[] => {
  if (!query.q && !query.country && !resolveExploreDestinationSlugQuery(query) && !query.venue) {
    return items;
  }
  return items.filter((item) => exploreMapItemMatchesGeoSearch(item, query));
};

export const mongoGeoSearchFilter = async (query: ExploreGeoSearchQuery): Promise<Filter<Document> | null> => {
  const clauses: Filter<Document>[] = [];
  const tokens = exploreGeoQueryTokens(query.q ?? '');
  if (tokens.length) {
    clauses.push({ 'geoRef.searchTokens': { $all: tokens.slice(0, 6) } });
  }
  const tree = await loadGeoTree();
  const named = [
    { raw: query.country, kinds: ['country'] },
    { raw: resolveExploreDestinationSlugQuery(query) ?? undefined, kinds: ['area', 'state'] },
    { raw: query.venue, kinds: ['venue', 'area'] },
  ];
  for (const { raw, kinds } of named) {
    const v = raw?.trim().toLowerCase();
    if (!v) continue;
    const node = [...tree.byId.values()].find(
      (n) =>
        kinds.includes(n.kind) &&
        (n.slug === v || n.names.en.toLowerCase() === v || n.path === v || String(n._id) === raw)
    );
    if (node) clauses.push({ 'geoRef.chain': String(node._id) });
    else clauses.push({ 'geoRef.searchTokens': v });
  }
  if (clauses.length === 0) return null;
  return clauses.length === 1 ? clauses[0]! : { $and: clauses };
};

export const findPinIdsMatchingGeoSearch = async (
  query: ExploreGeoSearchQuery,
  limit = 400
): Promise<{ locationIds: string[]; activityIds: string[]; facilityIds: string[] }> => {
  const filter = await mongoGeoSearchFilter(query);
  if (!filter) {
    return { locationIds: [], activityIds: [], facilityIds: [] };
  }
  const db = getMongoClient()!.db();
  const [locations, activities, facilities] = await Promise.all([
    db.collection(COLLECTIONS.LOCATIONS).find(filter as never).project({ _id: 1 }).limit(limit).toArray(),
    db.collection(COLLECTIONS.ACTIVITIES).find(filter as never).project({ _id: 1 }).limit(limit).toArray(),
    db.collection(COLLECTIONS.FACILITIES).find(filter as never).project({ _id: 1 }).limit(limit).toArray(),
  ]);
  return {
    locationIds: locations.map((d) => String(d._id)),
    activityIds: activities.map((d) => String(d._id)),
    facilityIds: facilities.map((d) => String(d._id)),
  };
};
