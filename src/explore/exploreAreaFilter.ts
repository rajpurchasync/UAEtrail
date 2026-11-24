import type { AreaPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { exploreAreaQueryParam, exploreDestinationQueryParam } from '@uaetrail/shared-types';

export { exploreAreaQueryParam, exploreDestinationQueryParam };

export const parseExploreAreaSlug = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null =>
  searchParams.get(exploreDestinationQueryParam)?.trim().toLowerCase() ||
  searchParams.get(exploreAreaQueryParam)?.trim().toLowerCase() ||
  null;

export const exploreMapItemMatchesAreaSlug = (
  item: ExploreMapItemDTO,
  areaSlug: string
): boolean => {
  const normalized = areaSlug.trim().toLowerCase();
  if (!normalized) return true;
  if (item.areaSlug?.toLowerCase() === normalized) return true;
  if (item.destinationSlug?.toLowerCase() === normalized) return true;
  return false;
};

export const filterExploreMapItemsByAreaSlug = (
  items: ExploreMapItemDTO[],
  areaSlug: string | null | undefined
): ExploreMapItemDTO[] => {
  if (!areaSlug?.trim()) return items;
  return items.filter((item) => exploreMapItemMatchesAreaSlug(item, areaSlug));
};

const normalizeAreaSearchQuery = (query: string): string => query.trim().toLowerCase();

const areaMatchesQuery = (area: AreaPublicDTO, q: string): boolean =>
  area.slug === q ||
  area.name.toLowerCase() === q ||
  area.name.toLowerCase().includes(q) ||
  area.slug.includes(q) ||
  area.region.toLowerCase().includes(q);

const areaMatchScore = (area: AreaPublicDTO, q: string): number => {
  if (area.slug === q || area.name.toLowerCase() === q) return 0;
  if (area.name.toLowerCase().startsWith(q)) return 1;
  if (area.slug.startsWith(q)) return 2;
  return 3;
};

/** Strong match — Enter navigates to area guide (§3.3). */
export const isStrongPublishedAreaSearchMatch = (area: AreaPublicDTO, query: string): boolean => {
  const q = normalizeAreaSearchQuery(query);
  if (!q) return false;
  return area.slug === q || area.name.toLowerCase() === q;
};

export const findPublishedAreaByQuery = (
  areas: AreaPublicDTO[],
  query: string
): AreaPublicDTO | null => searchPublishedAreasForQuery(areas, query, 1)[0] ?? null;

/** Area cards first in explore search — exact name/slug wins, then prefix, then contains. */
export const searchPublishedAreasForQuery = (
  areas: AreaPublicDTO[],
  query: string,
  limit = 4
): AreaPublicDTO[] => {
  const q = normalizeAreaSearchQuery(query);
  if (!q) return [];
  const matches = areas.filter((area) => areaMatchesQuery(area, q));
  matches.sort((a, b) => {
    const scoreDiff = areaMatchScore(a, q) - areaMatchScore(b, q);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  });
  return matches.slice(0, limit);
};

export const findPublishedAreaBySlug = (
  areas: AreaPublicDTO[],
  slug: string | null | undefined
): AreaPublicDTO | null => {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return null;
  return areas.find((area) => area.slug.toLowerCase() === normalized) ?? null;
};

export const areaIdForExploreAreaSlug = (
  areas: AreaPublicDTO[],
  slug: string | null | undefined
): string | null => findPublishedAreaBySlug(areas, slug)?.id ?? null;
