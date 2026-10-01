import {
  resolveWomenOnlyJoinEligibility,
  womenOnlyJoinBlockMessage,
  type UserGenderWire,
} from '@uaetrail/shared-types';

export const womenOnlyJoinMessageForActivity = (
  requirements: string[] | null | undefined,
  gender: UserGenderWire | null | undefined
): string | null => {
  const eligibility = resolveWomenOnlyJoinEligibility(requirements, gender);
  return womenOnlyJoinBlockMessage(eligibility);
};
