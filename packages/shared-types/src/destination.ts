/**
 * Curated outdoor **Destination** (program MIG-DESTINATION-GEO-2026).
 * Target: `destinations` API + `destinationId` on catalog rows; physical Mongo `areas` until P3 rename.
 */
import type { AreaDTO, AreaPublicDTO } from './area.js';

export type DestinationDTO = AreaDTO;

export type DestinationPublicDTO = AreaPublicDTO;

/** Public hub URL — canonical; legacy `/area/:slug` until P8 inbound. */
export const destinationHubPath = (slug: string): string =>
  `/destination/${encodeURIComponent(slug)}`;

/** Explore / list filter query key (canonical). Legacy `area` parsed as alias until P7. */
export const exploreDestinationQueryParam = 'destination' as const;

export type ExploreDestinationSlugQuery = {
  destination?: string | null;
  area?: string | null;
};

/** Curated destination hub slug from explore map URL (`destination` wins over legacy `area`). */
export const resolveExploreDestinationSlugQuery = (
  query: ExploreDestinationSlugQuery
): string | null => {
  const destination = query.destination?.trim().toLowerCase();
  if (destination) return destination;
  const area = query.area?.trim().toLowerCase();
  return area || null;
};

export type DestinationAssignableRow = {
  destinationId?: string | null;
  /** @deprecated Dual-read until MIG P9 — prefer {@link destinationId}. */
  areaId?: string | null;
};

/** Single choke for outdoor region id during migration (P3–P8 dual-write). */
export const resolveDestinationId = (
  row: DestinationAssignableRow | null | undefined
): string | null => {
  const id = row?.destinationId?.trim() || row?.areaId?.trim();
  return id || null;
};

export type ExploreMapDestinationLensItem = {
  areaSlug?: string | null;
  destinationSlug?: string | null;
  source?: string;
  id?: string;
};

/** Explore map / list lens — `destinationSlug` or legacy `areaSlug` (MIG-DESTINATION-GEO P5). */
export const exploreMapItemMatchesDestinationSlug = (
  item: ExploreMapDestinationLensItem,
  slug: string
): boolean => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return true;
  if (item.destinationSlug?.toLowerCase() === normalized) return true;
  if (item.areaSlug?.toLowerCase() === normalized) return true;
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

/** @deprecated Prefer {@link filterExploreMapItemsByDestinationSlug}. */
export const filterExploreMapItemsByAreaSlug = filterExploreMapItemsByDestinationSlug;

/** @deprecated Prefer {@link exploreMapItemMatchesDestinationSlug}. */
export const exploreMapItemMatchesAreaSlug = exploreMapItemMatchesDestinationSlug;