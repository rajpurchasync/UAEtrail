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