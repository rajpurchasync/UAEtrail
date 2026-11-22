import type {
  CommunityDiscoverCardDTO,
  CommunityDiscoverDetailDTO,
  CommunityViewerMembershipDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

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