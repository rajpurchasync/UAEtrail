import type {
  FamilyKidProfilePatchPayload,
  FamilyKidProfilePayload,
  SocialGroupInviteView,
  SocialGroupMemberView,
  SocialGroupView,
} from '../api/types';
import { api } from '../api/index';

export type {
  FamilyKidProfilePatchPayload,
  FamilyKidProfilePayload,
  SocialGroupInviteView,
  SocialGroupMemberView,
  SocialGroupView,
};

export type MeGroupDetailPayload = {
  group: SocialGroupView;
  membership: SocialGroupMemberView;
  members: SocialGroupMemberView[];
  invites: SocialGroupInviteView[];
};

export const fetchMeGroups = async (): Promise<SocialGroupView[]> => {
  const res = await api.getMeGroups();
  return res.data;
};

export const fetchMeGroupDetail = async (groupId: string): Promise<MeGroupDetailPayload> => {
  const res = await api.getMeGroupDetail(groupId);
  return res.data;
};

export const createMeGroup = async (payload: {
  teamLabel: 'family' | 'friends' | 'colleagues';
  type?: 'family' | 'friends' | 'colleagues';
  name: string;
  slogan?: string;
  bannerUrl?: string;
  photoUrl?: string;
}): Promise<SocialGroupView> => {
  const res = await api.createMeGroup(payload);
  return res.data;
};

export const deleteMeGroup = async (groupId: string): Promise<void> => {
  await api.deleteMeGroup(groupId);
};

export const updateMeGroupMemberActive = async (
  groupId: string,
  membershipId: string,
  isActive: boolean
): Promise<void> => {
  await api.updateMeGroupMemberStatus(groupId, membershipId, isActive);
};

export const updateMeGroupMemberRole = async (
  groupId: string,
  membershipId: string,
  role: 'member' | 'admin'
): Promise<void> => {
  await api.updateMeGroupMemberRole(groupId, membershipId, role);
};

export const removeMeGroupMember = async (groupId: string, membershipId: string): Promise<void> => {
  await api.removeMeGroupMember(groupId, membershipId);
};

export const createMeGroupInviteLink = async (
  groupId: string,
  payload: { email: string; role: 'admin' | 'member' }
): Promise<{ invite: SocialGroupInviteView; inviteLink: string }> => {
  const res = await api.createMeGroupInvite(groupId, payload);
  return { invite: res.data, inviteLink: res.inviteLink };
};

export const createMeGroupKidMember = async (
  groupId: string,
  payload: FamilyKidProfilePayload
): Promise<SocialGroupMemberView> => {
  const res = await api.createMeGroupKid(groupId, payload);
  return res.data;
};

export const updateMeGroupKidMember = async (
  groupId: string,
  membershipId: string,
  payload: FamilyKidProfilePatchPayload
): Promise<SocialGroupMemberView> => {
  const res = await api.updateMeGroupKid(groupId, membershipId, payload);
  return res.data;
};

export const acceptMeGroupInviteToken = async (token: string): Promise<void> => {
  await api.acceptMeGroupInvite(token);
};
