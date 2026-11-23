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

/** @deprecated Use `saveMemberAvailability` from `src/availability/saveMemberAvailability.ts`. */
export const saveMyMemberAvailability = async (
  input: UpsertMemberAvailabilityInput
): Promise<MemberAvailabilityDTO> => {
  const { saveMemberAvailability } = await import('../availability/saveMemberAvailability');
  return saveMemberAvailability(input);
};

export const fetchMyAvailabilityMatchPreview = async (): Promise<MemberAvailabilityMatchPreviewDTO> => {
  const res = await api.getMyAvailabilityMatchPreview();
  return res.data;
};
