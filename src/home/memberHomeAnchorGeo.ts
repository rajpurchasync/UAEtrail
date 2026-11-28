import { resolveViewerAnchorGeo, type ViewerAnchor } from '../list/browse/viewerAnchor';
import type { ViewerFix } from '../list/browse/placeDistance';

export const resolveMemberHomeAnchorGeo = (
  viewerFix: ViewerFix | null,
  anchor: ViewerAnchor | null
) => resolveViewerAnchorGeo(viewerFix, anchor);