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

const normalizeDestinationSearchQuery = (query: string): string => query.trim().toLowerCase();

const destinationMatchesQuery = (destination: DestinationPublicDTO, q: string): boolean =>
  destination.slug === q ||
  destination.name.toLowerCase() === q ||
  destination.name.toLowerCase().includes(q) ||
  destination.slug.includes(q) ||
  destination.region.toLowerCase().includes(q);

const destinationMatchScore = (destination: DestinationPublicDTO, q: string): number => {
  if (destination.slug === q || destination.name.toLowerCase() === q) return 0;
  if (destination.name.toLowerCase().startsWith(q)) return 1;
  if (destination.slug.startsWith(q)) return 2;
  return 3;
};

/** Strong match — Enter navigates to destination hub (§3.3). */
export const isStrongPublishedDestinationSearchMatch = (
  destination: DestinationPublicDTO,
  query: string
): boolean => {
  const q = normalizeDestinationSearchQuery(query);
  if (!q) return false;
  return destination.slug === q || destination.name.toLowerCase() === q;
};

export const findPublishedDestinationByQuery = (
  destinations: DestinationPublicDTO[],
  query: string
): DestinationPublicDTO | null => searchPublishedDestinationsForQuery(destinations, query, 1)[0] ?? null;

/** Destination cards first in explore search — exact name/slug wins, then prefix, then contains. */
export const searchPublishedDestinationsForQuery = (
  destinations: DestinationPublicDTO[],
  query: string,
  limit = 4
): DestinationPublicDTO[] => {
  const q = normalizeDestinationSearchQuery(query);
  if (!q) return [];
  const matches = destinations.filter((destination) => destinationMatchesQuery(destination, q));
  matches.sort((a, b) => {
    const scoreDiff = destinationMatchScore(a, q) - destinationMatchScore(b, q);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  });
  return matches.slice(0, limit);
};

export const findPublishedDestinationBySlug = (
  destinations: DestinationPublicDTO[],
  slug: string | null | undefined
): DestinationPublicDTO | null => {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return null;
  return destinations.find((destination) => destination.slug.toLowerCase() === normalized) ?? null;
};

export const destinationIdForExploreDestinationSlug = (
  destinations: DestinationPublicDTO[],
  slug: string | null | undefined
): string | null => findPublishedDestinationBySlug(destinations, slug)?.id ?? null;

export type { ExploreMapItemDTO };