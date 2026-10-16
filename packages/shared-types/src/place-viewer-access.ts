import type { CatalogActionId } from './catalog-actions.js';
import type { DetailExposure, ViewerGateReason } from './activity-viewer-access.js';

export type PlaceViewerAccessLevel =
  | 'platform_admin'
  | 'submitter'
  | 'public'
  | 'denied';

export type PlaceViewerAccessDTO = {
  exposure: DetailExposure;
  level: PlaceViewerAccessLevel;
  gateReason: ViewerGateReason | null;
  canOpenDetailPage: boolean;
  allowedActions: CatalogActionId[];
};
