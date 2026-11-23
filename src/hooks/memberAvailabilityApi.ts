import type { MemberAvailabilityDTO, MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMyMemberAvailability = async (): Promise<MemberAvailabilityDTO> => {
  const res = await api.getMyAvailability();
  return res.data;
};

export const fetchMyAvailabilityMatchPreview = async (): Promise<MemberAvailabilityMatchPreviewDTO> => {
  const res = await api.getMyAvailabilityMatchPreview();
  return res.data;
};
