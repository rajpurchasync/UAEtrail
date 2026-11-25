/** Curated outdoor **Destination** — public `/destinations`, catalog `destinationId`. */
import type { AreaDTO, AreaPublicDTO } from './area.js';

export type DestinationDTO = AreaDTO;

export type DestinationPublicDTO = AreaPublicDTO;

/** Public hub URL — `/destination/:slug` only. */
export const destinationHubPath = (slug: string): string =>
  `/destination/${encodeURIComponent(slug)}`;

/** Explore / list filter query key. */
export const exploreDestinationQueryParam = 'destination' as const;

export type ExploreDestinationSlugQuery = {
  destination?: string | null;
};

export const resolveExploreDestinationSlugQuery = (
  query: ExploreDestinationSlugQuery
): string | null => {
  const destination = query.destination?.trim().toLowerCase();
  return destination || null;
};

export type DestinationAssignableRow = {
  destinationId?: string | null;
};

export const resolveDestinationId = (
  row: DestinationAssignableRow | null | undefined
): string | null => row?.destinationId?.trim() || null;

/** Mongo/catalog patch shape for assigning a destination on create or update. */
export const catalogDestinationIdUpdate = (
  destinationId: string | null | undefined
): { destinationId: string | null } => ({
  destinationId: destinationId?.trim() || null,
});

export type ExploreMapDestinationLensItem = {
  destinationSlug?: string | null;
  source?: string;
  id?: string;
};

export const exploreMapItemMatchesDestinationSlug = (
  item: ExploreMapDestinationLensItem,
  slug: string
): boolean => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return true;
  if (item.destinationSlug?.toLowerCase() === normalized) return true;
  if (item.source === 'area' && item.id === `area:${normalized}`) return true;
  return false;
};

export const filterExploreMapItemsByDestinationSlug = <T extends ExploreMapDestinationLensItem>(
  items: T[],
  slug: string | null | undefined
): T[] => {
  if (!slug?.trim()) return items;
  return items.filter((item) => exploreMapItemMatchesDestinationSlug(item, slug));
};