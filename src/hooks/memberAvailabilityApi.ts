import type {
  MemberAvailabilityDTO,
  MemberAvailabilityMatchPreviewDTO,
  UpsertMemberAvailabilityInput,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMyMemberAvailability = async (): Promise<MemberAvailabilityDTO> => {
  const res = await api.getMyAvailability();
  return res.data;
};

export const saveMyMemberAvailability = async (
  input: UpsertMemberAvailabilityInput
): Promise<MemberAvailabilityDTO> => {
  const res = await api.putMyAvailability(input);
  return res.data;
};

export const fetchMyAvailabilityMatchPreview = async (): Promise<MemberAvailabilityMatchPreviewDTO> => {
  const res = await api.getMyAvailabilityMatchPreview();
  return res.data;
};
