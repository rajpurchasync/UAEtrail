import type { UserProfile } from '@uaetrail/shared-types';
import { api } from '../api/index';

export type CompleteSignupProfilePayload = {
  dateOfBirth: string;
  gender: NonNullable<UserProfile['gender']>;
  countryCode: NonNullable<UserProfile['countryCode']>;
};

export const completeSignupProfile = async (
  payload: CompleteSignupProfilePayload
): Promise<void> => {
  await api.completeSignupProfile(payload);
};
