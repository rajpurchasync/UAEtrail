/**
 * MIG-DESTINATION-GEO D0.5 — dual-write `parentPlaceId` + `onSiteId` on facilities until cutover.
 */
export const mirrorCatalogOnSiteIds = (
  parentPlaceId: string | null | undefined
): { parentPlaceId: string | null; onSiteId: string | null } => {
  const id = parentPlaceId?.trim() || null;
  return { parentPlaceId: id, onSiteId: id };
};

export const resolveStoredOnSiteId = (row: {
  onSiteId?: string | null;
  parentPlaceId?: string | null;
}): string | null => row.onSiteId?.trim() || row.parentPlaceId?.trim() || null;