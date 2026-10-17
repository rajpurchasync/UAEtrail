import type { FacilityDTO, FacilityViewerAccessDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { toFacilityDto } from '../lib/facility-mappers.js';
import { findFacilityForDetailView, listFacilitiesPaged } from '../lib/facilities-store.js';
import { buildFacilityViewerAccess } from './facility-viewer-access.js';

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

  return { data: toFacilityDto(facility), viewerAccess };
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
