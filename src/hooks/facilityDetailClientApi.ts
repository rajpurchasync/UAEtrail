import type { ActivityViewerAccessDTO, FacilityDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export type FacilityDetailResponse = {
  data: FacilityDTO;
  viewerAccess: ActivityViewerAccessDTO;
};

export const fetchPublicFacilityDetail = async (facilityId: string): Promise<FacilityDetailResponse> => {
  return api.getPublicFacilityDetail(facilityId);
};
