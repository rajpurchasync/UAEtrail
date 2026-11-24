/** MIG-DESTINATION-GEO D0.5 — facility trail scope via `onSiteId` only (no `parentPlaceId` dual-write). */

export const catalogOnSiteIdUpdate = (
  onSiteId: string | null | undefined
): { onSiteId: string | null } => {
  const id = onSiteId?.trim() || null;
  return { onSiteId: id };
};

export const resolveStoredOnSiteId = (row: { onSiteId?: string | null }): string | null =>
  row.onSiteId?.trim() || null;