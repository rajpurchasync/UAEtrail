/** MIG-DESTINATION-GEO — `destinationId` only (no legacy `areaId` dual-write). */

export const catalogDestinationIdUpdate = (
  destinationId: string | null | undefined
): { destinationId: string | null } => {
  const id = destinationId?.trim() || null;
  return { destinationId: id };
};

export const resolveStoredDestinationId = (row: {
  destinationId?: string | null;
}): string | null => row.destinationId?.trim() || null;