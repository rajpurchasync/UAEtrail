import {
  computeFacilityViewerAccess,
  resolveCatalogViewerLevel,
  type CatalogModerationStatus,
  type CatalogPublicationStatus,
  type FacilityViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { Facility } from '../domain/facility.js';
import { UserRole } from '../domain/enums.js';

export const buildFacilityViewerAccess = (input: {
  viewerUserId: string | null;
  viewerRole?: string | null;
  facility: Pick<
    Facility,
    'status' | 'submittedById' | 'registeredByUserId' | 'moderationStatus' | 'publicationStatus'
  >;
}): FacilityViewerAccessDTO => {
  const isPlatformAdmin = input.viewerRole === UserRole.PLATFORM_ADMIN;
  const level = resolveCatalogViewerLevel({
    viewerUserId: input.viewerUserId,
    isPlatformAdmin,
    registeredByUserId: input.facility.registeredByUserId ?? null,
    submittedById: input.facility.submittedById ?? null,
    status: String(input.facility.status),
    moderationStatus: input.facility.moderationStatus as CatalogModerationStatus | undefined,
    publicationStatus: input.facility.publicationStatus as CatalogPublicationStatus | undefined,
  });

  return computeFacilityViewerAccess({ level, viewerUserId: input.viewerUserId });
};
