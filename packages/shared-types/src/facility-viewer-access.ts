import type { CatalogActionId } from './catalog-actions.js';
import type { DetailExposure, ViewerGateReason } from './activity-viewer-access.js';

export type FacilityViewerAccessLevel =
  | 'platform_admin'
  | 'submitter'
  | 'public'
  | 'denied';

export type FacilityViewerAccessDTO = {
  exposure: DetailExposure;
  level: FacilityViewerAccessLevel;
  gateReason: ViewerGateReason | null;
  canOpenDetailPage: boolean;
  allowedActions: CatalogActionId[];
};
