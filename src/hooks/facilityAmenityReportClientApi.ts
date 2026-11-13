import type { AmenityState } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const submitFacilityAmenityReport = async (input: {
  facilityId: string;
  amenityState: AmenityState;
  note?: string;
  photoUrl: string;
}): Promise<void> => {
  await api.submitFacilityAmenityReport(input.facilityId, {
    amenityState: input.amenityState,
    note: input.note,
    photoUrl: input.photoUrl,
  });
};
