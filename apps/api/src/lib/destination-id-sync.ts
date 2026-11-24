/**
 * MIG-DESTINATION-GEO-2026 — dual-write `areaId` + `destinationId` until P9.
 * @see packages/shared-types/src/destination.ts `resolveDestinationId`
 */

export const mirrorCatalogDestinationIds = (
  areaId: string | null | undefined
): { areaId: string | null; destinationId: string | null } => {
  const id = areaId?.trim() ? areaId.trim() : null;
  return { areaId: id, destinationId: id };
};

export const resolveStoredDestinationId = (row: {
  destinationId?: string | null;
  areaId?: string | null;
}): string | null => row.destinationId?.trim() || row.areaId?.trim() || null;