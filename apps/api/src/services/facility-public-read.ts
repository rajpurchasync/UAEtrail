import type { FacilityDTO, FacilityViewerAccessDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { toFacilityDto } from '../lib/facility-mappers.js';
import { findFacilityForDetailView, listFacilitiesPaged } from '../lib/facilities-store.js';
import { getFacilityAmenityReportSummary } from '../lib/amenity-reports-store.js';
import { findLocationForDetailView } from '../lib/activities-store.js';
import { buildFacilityViewerAccess } from './facility-viewer-access.js';

const resolveParentPlaceName = async (input: {
  parentPlaceId: string | null | undefined;
  viewerUserId: string | null;
  viewerRole: string | null;
}): Promise<string | null> => {
  const parentPlaceId = input.parentPlaceId?.trim();
  if (!parentPlaceId) return null;
  const parent = await findLocationForDetailView(
    parentPlaceId,
    input.viewerUserId,
    input.viewerRole
  );
  const name = parent?.name?.trim();
  return name || null;
};

export type PublicFacilityDetailPayload = {
  data: FacilityDTO;
  viewerAccess: FacilityViewerAccessDTO;
};

/** Public facility detail (`GET /facilities/:id`). */
export const loadPublicFacilityDetail = async (input: {
  facilityId: string;
  viewerUserId: string | null;
  viewerRole?: string | null;
}): Promise<PublicFacilityDetailPayload> => {
  const facility = await findFacilityForDetailView(
    input.facilityId,
    input.viewerUserId,
    input.viewerRole ?? null
  );
  if (!facility) {
    throw new ApiError(404, 'facility_not_found', 'Facility not found.');
  }

  const viewerAccess = buildFacilityViewerAccess({
    viewerUserId: input.viewerUserId,
    viewerRole: input.viewerRole ?? null,
    facility,
  });

  if (!viewerAccess.canOpenDetailPage) {
    throw new ApiError(404, 'facility_not_found', 'Facility not found.');
  }

  const base = toFacilityDto(facility);
  const [amenitySummary, parentPlaceName] = await Promise.all([
    getFacilityAmenityReportSummary(input.facilityId),
    resolveParentPlaceName({
      parentPlaceId: facility.parentPlaceId,
      viewerUserId: input.viewerUserId,
      viewerRole: input.viewerRole ?? null,
    }),
  ]);
  const { pending, latest } = amenitySummary;

  return {
    data: {
      ...base,
      parentPlaceName,
      lastReportedAmenityState: latest?.amenityState ?? null,
      lastReportedAmenityAt: latest ? latest.createdAt.toISOString() : null,
      pendingAmenityReview: pending
        ? {
            amenityState: pending.amenityState,
            submittedAt: pending.createdAt.toISOString(),
          }
        : null,
    },
    viewerAccess,
  };
};

export const listPublicFacilitiesPaged = async (input: {
  page: number;
  pageSize: number;
  countryCode?: string;
}) => {
  const { items, total } = await listFacilitiesPaged({
    page: input.page,
    pageSize: input.pageSize,
    countryCode: input.countryCode,
  });
  return { items: items.map(toFacilityDto), total };
};
