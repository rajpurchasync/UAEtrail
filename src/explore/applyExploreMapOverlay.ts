import type { ExploreMapItemDTO, ExploreMapOverlayDTO } from '@uaetrail/shared-types';

/** Merge signed-in `GET /me/discover/overlay` viewerAccess onto the public map catalog. */
export const applyExploreMapOverlay = (
  items: ExploreMapItemDTO[],
  overlay: ExploreMapOverlayDTO | null | undefined
): ExploreMapItemDTO[] => {
  if (!overlay?.items.length) return items;
  const byId = new Map(overlay.items.map((row) => [row.id, row.viewerAccess]));
  return items.map((item) => {
    const viewerAccess = byId.get(item.id);
    return viewerAccess ? { ...item, viewerAccess } : item;
  });
};
