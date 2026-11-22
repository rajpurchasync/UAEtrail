import type {
  CommunityDiscoverActivitiesDTO,
  CommunityDiscoverCardDTO,
  CommunityDiscoverDetailDTO,
  CommunityHostProfilePatchDTO,
  CommunityViewerMembershipDTO,
  CommunityHostManageDTO,
  MeCommunityDiscoverListDTO,
  MeCreateCommunityDiscoverDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMeCommunities = async (): Promise<MeCommunityDiscoverListDTO> => {
  const res = await api.getMeCommunities();
  return res.data;
};

export const createDiscoverableCommunity = async (
  body: MeCreateCommunityDiscoverDTO
): Promise<{ list: MeCommunityDiscoverListDTO; detail: CommunityDiscoverDetailDTO }> => {
  const res = await api.createDiscoverableCommunity(body);
  return res.data;
};

export const fetchExploreCommunities = async (): Promise<CommunityDiscoverCardDTO[]> => {
  const res = await api.getExploreCommunities();
  return res.data;
};

export const fetchExploreCommunityBySlug = async (
  slug: string,
  options?: { auth?: boolean }
): Promise<CommunityDiscoverDetailDTO> => {
  const res = await api.getExploreCommunityBySlug(slug, options);
  return res.data;
};

export const joinDiscoverableCommunity = async (
  communityId: string
): Promise<CommunityViewerMembershipDTO> => {
  const res = await api.joinDiscoverableCommunity(communityId);
  return res.data;
};

export const leaveDiscoverableCommunity = async (
  communityId: string
): Promise<CommunityDiscoverDetailDTO> => {
  const res = await api.leaveDiscoverableCommunity(communityId);
  return res.data;
};

export const patchCommunityProfileByHost = async (
  communityId: string,
  body: CommunityHostProfilePatchDTO
): Promise<CommunityDiscoverDetailDTO> => {
  const res = await api.patchCommunityProfileByHost(communityId, body);
  return res.data;
};

export const fetchExploreCommunityActivities = async (
  slug: string
): Promise<CommunityDiscoverActivitiesDTO> => {
  const res = await api.getExploreCommunityActivities(slug);
  return res.data;
};

export const fetchCommunityHostManage = async (
  communityId: string
): Promise<CommunityHostManageDTO> => {
  const res = await api.getCommunityHostManage(communityId);
  return res.data;
};

export const approveCommunityMemberByHost = async (
  communityId: string,
  userId: string
): Promise<CommunityDiscoverDetailDTO> => {
  const res = await api.approveCommunityMemberByHost(communityId, userId);
  return res.data;
};

export const inviteCommunityMemberByHost = async (
  communityId: string,
  body: { email?: string; userId?: string }
): Promise<void> => {
  await api.inviteCommunityMemberByHost(communityId, body);
};

export const removeCommunityMemberByHost = async (
  communityId: string,
  userId: string
): Promise<CommunityDiscoverDetailDTO> => {
  const res = await api.removeCommunityMemberByHost(communityId, userId);
  return res.data;
};

export const linkDiscoverableCommunityActivity = async (
  communityId: string,
  activityId: string
): Promise<{ ok: true; activityId: string; discoverCommunityId: string }> => {
  const res = await api.linkDiscoverableCommunityActivity(communityId, activityId);
  return res.data;
};

export const patchCommunityStatusByHost = async (
  communityId: string,
  status: 'active' | 'suspended'
): Promise<CommunityDiscoverDetailDTO> => {
  const res = await api.patchCommunityStatusByHost(communityId, { status });
  return res.data;
};

export const addCommunityCoAdminByHost = async (
  communityId: string,
  userId: string
): Promise<CommunityHostManageDTO> => {
  const res = await api.addCommunityCoAdminByHost(communityId, userId);
  return res.data;
};

export const removeCommunityCoAdminByHost = async (
  communityId: string,
  userId: string
): Promise<CommunityHostManageDTO> => {
  const res = await api.removeCommunityCoAdminByHost(communityId, userId);
  return res.data;
};