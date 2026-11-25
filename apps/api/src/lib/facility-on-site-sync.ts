/** Facility trail scope via `onSiteId` (parent place on site, not destination hub). */

export const catalogOnSiteIdUpdate = (
  onSiteId: string | null | undefined
): { onSiteId: string | null } => {
  const id = onSiteId?.trim() || null;
  return { onSiteId: id };
};

export const resolveStoredOnSiteId = (row: { onSiteId?: string | null }): string | null =>
  row.onSiteId?.trim() || null;