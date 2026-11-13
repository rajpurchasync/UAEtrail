import type {
  FindCrewVisibility,
  MemberProfileStatsDTO,
  MemberProfileViewStatsDTO,
  ProfileDateOfBirthShare,
  ProfileFieldPrivacySettings,
  ProfileFriendsListShare,
  RewardBadgeDTO,
} from '@uaetrail/shared-types';
import type { UserProfile } from '../api/types';
import { api } from '../api/index';
import { normalizeMeProfile } from '../utils/normalizeMeProfile';

export const fetchMeProfile = async (): Promise<UserProfile> => {
  const res = await api.getMeProfile();
  return normalizeMeProfile(res.data);
};

export const updateMeProfile = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await api.updateMeProfile(payload);
  return normalizeMeProfile(res.data);
};

export type MemberProfilePrivacySettings = ProfileFieldPrivacySettings & {
  dateOfBirthShare: ProfileDateOfBirthShare;
  friendsListShare: ProfileFriendsListShare;
  findCrewVisibility: FindCrewVisibility;
};

export const updateMeProfileFieldPrivacy = async (patch: {
  fieldPrivacy?: Partial<ProfileFieldPrivacySettings>;
  dateOfBirthShare?: ProfileDateOfBirthShare;
  friendsListShare?: ProfileFriendsListShare;
  findCrewVisibility?: FindCrewVisibility;
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
    emergencyContactRelation: string;
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
