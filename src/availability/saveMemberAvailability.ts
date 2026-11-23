import type { MemberAvailabilityDTO, UpsertMemberAvailabilityInput } from '@uaetrail/shared-types';
import { api } from '../api/index';

/** Canonical client write for `PUT /me/availability` (MIG-SG-B2). */
export const saveMemberAvailability = async (
  input: UpsertMemberAvailabilityInput
): Promise<MemberAvailabilityDTO> => {
  const res = await api.putMyAvailability(input);
  return res.data;
};