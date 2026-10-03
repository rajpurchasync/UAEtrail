import type { ActivityViewerAccessDTO } from './activity-viewer-access.js';

/**
 * Commerce map rows (shop / agency) — guests may peek on the map; storefront detail requires sign-in.
 * @see docs/DOMAIN_CANONICALS.md §15.4 (Shop row)
 */
export const resolveCommerceMapViewerAccess = (
  viewerUserId: string | null
): ActivityViewerAccessDTO => {
  if (!viewerUserId) {
    return {
      exposure: 'redacted',
      level: 'public',
      gateReason: 'sign_in',
      canViewFullActivity: false,
      canOpenDetailPage: false,
      joinMode: 'open',
    };
  }
  return {
    exposure: 'full',
    level: 'public',
    gateReason: null,
    canViewFullActivity: true,
    canOpenDetailPage: true,
    joinMode: 'open',
  };
};

/** Trail / camp / event venue catalog — public detail for everyone. */
export const resolvePublicPlaceMapViewerAccess = (): ActivityViewerAccessDTO => ({
  exposure: 'full',
  level: 'public',
  gateReason: null,
  canViewFullActivity: true,
  canOpenDetailPage: true,
  joinMode: 'open',
});
