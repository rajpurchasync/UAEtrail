import type { ExploreMapOverlayDTO } from '@uaetrail/shared-types';
import {
  attachExploreMapViewerAccess,
  buildExploreMapViewerAccessContext,
} from '../lib/explore-map-viewer-access.js';
import { resolveExploreMapCatalogItemsForQuery } from '../lib/explore-map-route.js';

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
  const { items } = await resolveExploreMapCatalogItemsForQuery(input.query);
  const ctx = await buildExploreMapViewerAccessContext({
    viewerUserId: input.viewerUserId,
    userRole: input.userRole ?? null,
    items,
  });
  const withAccess = attachExploreMapViewerAccess(items, ctx);
  return {
    items: withAccess.flatMap((item) =>
      item.viewerAccess ? [{ id: item.id, viewerAccess: item.viewerAccess }] : []
    ),
  };
};
