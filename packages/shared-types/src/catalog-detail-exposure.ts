import type { CatalogActionId } from './catalog-actions.js';
import type { CatalogModerationStatus, CatalogPublicationStatus } from './catalog-lifecycle.js';
import type { DetailExposure, ViewerGateReason } from './activity-viewer-access.js';
import type { FacilityViewerAccessDTO, FacilityViewerAccessLevel } from './facility-viewer-access.js';
import type { PlaceViewerAccessDTO, PlaceViewerAccessLevel } from './place-viewer-access.js';

export const resolveCatalogViewerLevel = (input: {
  viewerUserId: string | null;
  isPlatformAdmin?: boolean;
  registeredByUserId?: string | null;
  submittedById?: string | null;
  status: string;
  moderationStatus?: CatalogModerationStatus | null;
  publicationStatus?: CatalogPublicationStatus | null;
}): PlaceViewerAccessLevel => {
  if (input.isPlatformAdmin) return 'platform_admin';

  const submitterId = input.registeredByUserId ?? input.submittedById ?? null;
  if (input.viewerUserId && submitterId && input.viewerUserId === submitterId) {
    return 'submitter';
  }

  const status = String(input.status).toUpperCase();
  const moderation: CatalogModerationStatus =
    input.moderationStatus ??
    (status === 'DRAFT' ? 'pending' : status === 'INACTIVE' ? 'suspended' : 'approved');
  const publication: CatalogPublicationStatus =
    input.publicationStatus ??
    (status === 'ACTIVE' ? 'listed' : status === 'DRAFT' ? 'unlisted' : 'unlisted');

  if (status === 'ACTIVE' && moderation === 'approved' && publication === 'listed') {
    return 'public';
  }

  return 'denied';
};

const actionsForLevel = (level: PlaceViewerAccessLevel): CatalogActionId[] => {
  if (level === 'platform_admin') {
    return ['view_detail', 'open_maps', 'arrange_trip', 'submit_review', 'moderate'];
  }
  if (level === 'submitter') {
    return ['view_submitter_preview', 'edit_submission', 'open_maps'];
  }
  if (level === 'public') {
    return ['view_detail', 'open_maps', 'arrange_trip', 'submit_review'];
  }
  return [];
};

const exposureForLevel = (level: PlaceViewerAccessLevel): DetailExposure => {
  if (level === 'denied') return 'none';
  if (level === 'submitter') return 'redacted';
  return 'full';
};

const gateForLevel = (level: PlaceViewerAccessLevel, viewerUserId: string | null): ViewerGateReason | null => {
  if (level === 'denied' && !viewerUserId) return 'sign_in';
  if (level === 'denied') return null;
  return null;
};

export const computePlaceViewerAccess = (input: {
  level: PlaceViewerAccessLevel;
  viewerUserId: string | null;
}): PlaceViewerAccessDTO => {
  const exposure = exposureForLevel(input.level);
  return {
    exposure,
    level: input.level,
    gateReason: gateForLevel(input.level, input.viewerUserId),
    canOpenDetailPage: input.level !== 'denied',
    allowedActions: actionsForLevel(input.level),
  };
};

export const computeFacilityViewerAccess = (input: {
  level: FacilityViewerAccessLevel;
  viewerUserId: string | null;
}): FacilityViewerAccessDTO => {
  const place = computePlaceViewerAccess(input);
  return {
    exposure: place.exposure,
    level: input.level,
    gateReason: place.gateReason,
    canOpenDetailPage: place.canOpenDetailPage,
    allowedActions: place.allowedActions,
  };
};
