import type { UserProfile } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMeProfile = async (): Promise<UserProfile> => {
  const res = await api.getMeProfile();
  return res.data;
};

export const updateMeProfile = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await api.updateMeProfile(payload);
  return res.data;
};
