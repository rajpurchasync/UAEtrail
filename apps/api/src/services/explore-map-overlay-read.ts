import type { ExploreMapOverlayDTO } from '@uaetrail/shared-types';
import { loadExploreMapForRequest } from '../lib/explore-map-route.js';

/** Signed-in peek/engagement for the public explore catalog (`GET /me/discover/overlay`). */
export const loadExploreMapOverlayForViewer = async (input: {
  query: {
    bbox?: string;
    cursor?: string;
    limit?: string;
    area?: string;
  };
  viewerUserId: string;
  userRole?: string | null;
}): Promise<ExploreMapOverlayDTO> => {
  const payload = await loadExploreMapForRequest({
    query: input.query,
    viewerUserId: input.viewerUserId,
    userRole: input.userRole ?? null,
  });
  return {
    items: payload.items.flatMap((item) =>
      item.viewerAccess ? [{ id: item.id, viewerAccess: item.viewerAccess }] : []
    ),
  };
};
