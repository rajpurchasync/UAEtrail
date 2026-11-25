import type { DestinationPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  exploreDestinationQueryParam,
  filterExploreMapItemsByDestinationSlug,
  exploreMapItemMatchesDestinationSlug,
} from '@uaetrail/shared-types';

export {
  exploreDestinationQueryParam,
  filterExploreMapItemsByDestinationSlug,
  exploreMapItemMatchesDestinationSlug,
};

export const parseExploreDestinationSlug = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null =>
  searchParams.get(exploreDestinationQueryParam)?.trim().toLowerCase() || null;

const normalizeAreaSearchQuery = (query: string): string => query.trim().toLowerCase();

const areaMatchesQuery = (area: DestinationPublicDTO, q: string): boolean =>
  area.slug === q ||
  area.name.toLowerCase() === q ||
  area.name.toLowerCase().includes(q) ||
  area.slug.includes(q) ||
  area.region.toLowerCase().includes(q);

const areaMatchScore = (area: DestinationPublicDTO, q: string): number => {
  if (area.slug === q || area.name.toLowerCase() === q) return 0;
  if (area.name.toLowerCase().startsWith(q)) return 1;
  if (area.slug.startsWith(q)) return 2;
  return 3;
};

/** Strong match — Enter navigates to destination hub (§3.3). */
export const isStrongPublishedAreaSearchMatch = (area: DestinationPublicDTO, query: string): boolean => {
  const q = normalizeAreaSearchQuery(query);
  if (!q) return false;
  return area.slug === q || area.name.toLowerCase() === q;
};

export const findPublishedAreaByQuery = (
  areas: DestinationPublicDTO[],
  query: string
): DestinationPublicDTO | null => searchPublishedAreasForQuery(areas, query, 1)[0] ?? null;

/** Destination cards first in explore search — exact name/slug wins, then prefix, then contains. */
export const searchPublishedAreasForQuery = (
  areas: DestinationPublicDTO[],
  query: string,
  limit = 4
): DestinationPublicDTO[] => {
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
  areas: DestinationPublicDTO[],
  slug: string | null | undefined
): DestinationPublicDTO | null => {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return null;
  return areas.find((area) => area.slug.toLowerCase() === normalized) ?? null;
};

export const destinationIdForExploreDestinationSlug = (
  areas: DestinationPublicDTO[],
  slug: string | null | undefined
): string | null => findPublishedAreaBySlug(areas, slug)?.id ?? null;

export type { ExploreMapItemDTO };