import type {
  MemberProfileStatsDTO,
  MemberProfileViewStatsDTO,
  ProfileDateOfBirthShare,
  ProfileFieldPrivacySettings,
  RewardBadgeDTO,
} from '@uaetrail/shared-types';
import type { UserProfile } from '../api/types';
import { api } from '../api/index';

export const fetchMeProfile = async (): Promise<UserProfile> => {
  const res = await api.getMeProfile();
  return res.data;
};

export const updateMeProfile = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await api.updateMeProfile(payload);
  return res.data;
};

export type MemberProfilePrivacySettings = ProfileFieldPrivacySettings & {
  dateOfBirthShare: ProfileDateOfBirthShare;
  friendsListShare: import('@uaetrail/shared-types').ProfileFriendsListShare;
};

export const updateMeProfileFieldPrivacy = async (patch: {
  fieldPrivacy?: Partial<ProfileFieldPrivacySettings>;
  dateOfBirthShare?: ProfileDateOfBirthShare;
  friendsListShare?: import('@uaetrail/shared-types').ProfileFriendsListShare;
}): Promise<MemberProfilePrivacySettings> => {
  const res = await api.updateMeProfileFieldPrivacy(patch);
  return res.data;
};

export const updateMeMedicalSafetyProfile = async (
  payload: {
    bloodGroup: NonNullable<UserProfile['bloodGroup']>;
    medicalConditions: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }
): Promise<UserProfile> => {
  const res = await api.updateMeMedicalSafetyProfile(payload);
  return res.data as UserProfile;
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
