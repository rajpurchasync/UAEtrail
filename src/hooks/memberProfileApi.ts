import type {
  MemberProfileStatsDTO,
  MemberProfileViewStatsDTO,
  RewardBadgeDTO,
  UserProfile,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMeProfile = async (): Promise<UserProfile> => {
  const res = await api.getMeProfile();
  return res.data;
};

export const updateMeProfile = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await api.updateMeProfile(payload);
  return res.data;
};

export const fetchMeProfileStats = async (): Promise<MemberProfileStatsDTO> => {
  const res = await api.getMeProfileStats();
  return res.data;
};

export const fetchMeProfileViewStats = async (): Promise<MemberProfileViewStatsDTO> => {
  const res = await api.getMeProfileViewStats();
  return res.data;
};

export const fetchMemberBadges = async (): Promise<RewardBadgeDTO[]> => {
  const res = await api.getMemberBadges();
  return res.data;
};
