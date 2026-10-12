import type {
  BuddyRelationshipDTO,
  BuddyRequestDTO,
  MemberFollowSummaryDTO,
  MemberDiscoveryQuotaDTO,
  MemberBrowseCardDTO,
  MemberDiscoverySeekingRowDTO,
  SocialPeopleDTO,
  SocialPeoplePreviewDTO,
  SocialPeopleSegment,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { ExploreAvailabilityIndex } from '../api/domains/availability';
import { api } from '../api/index';

export const fetchMemberPeopleNetwork = async (
  segment: SocialPeopleSegment = 'all'
): Promise<SocialPeopleDTO> => {
  const res = await api.getMemberPeopleNetwork(segment);
  return res.data;
};

export const fetchMemberPeopleNetworkPreview = async (): Promise<SocialPeoplePreviewDTO> => {
  const res = await api.getMemberPeopleNetworkPreview();
  return res.data;
};

export type MemberDiscoveryRosterPayload = {
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  seekingOnMap: MemberDiscoverySeekingRowDTO[];
  followed: MemberBrowseCardDTO[];
  directory: MemberBrowseCardDTO[];
  quota: MemberDiscoveryQuotaDTO;
};

export const fetchMeMemberDiscoveryRoster = async (options?: {
  page?: number;
  pageSize?: number;
  q?: string;
  date?: string | null;
  omitDirectory?: boolean;
}): Promise<MemberDiscoveryRosterPayload> => {
  const res = await api.getMeMemberDiscoveryRoster(options);
  return {
    friendsGoing: res.data.friendsGoing ?? [],
    hostsGoing: res.data.hostsGoing ?? [],
    seekingOnMap: res.data.seekingOnMap ?? [],
    followed: res.data.followed ?? [],
    directory: res.data.directory ?? [],
    quota: res.meta.quota,
  };
};

export const fetchExplorePeopleAvailability = async (params: {
  from: string;
  to: string;
  kind?: string;
  area?: string;
  buddiesOnly?: boolean;
}): Promise<ExploreAvailabilityIndex> => {
  const res = await api.explorePeopleAvailability(params);
  return res.data;
};

export const sendMemberBuddyRequest = async (
  targetUserId: string,
  message?: string
): Promise<BuddyRequestDTO> => {
  const res = await api.sendBuddyRequest({ targetUserId, message });
  return res.data;
};

export const fetchBuddyRelationship = async (userId: string): Promise<BuddyRelationshipDTO> => {
  const res = await api.getBuddyRelationship(userId);
  return res.data;
};

export const acceptMemberBuddyRequest = async (requestId: string): Promise<BuddyRequestDTO> => {
  const res = await api.acceptBuddyRequest(requestId);
  return res.data;
};

export const declineMemberBuddyRequest = async (requestId: string): Promise<BuddyRequestDTO> => {
  const res = await api.declineBuddyRequest(requestId);
  return res.data;
};

export const cancelMemberBuddyRequest = async (requestId: string): Promise<BuddyRequestDTO> => {
  const res = await api.cancelBuddyRequest(requestId);
  return res.data;
};

export const unfriendMemberBuddy = async (userId: string): Promise<void> => {
  await api.unfriendBuddy(userId);
};

export const fetchMeFollowingMembers = async (): Promise<MemberFollowSummaryDTO[]> => {
  const res = await api.getMeFollowing();
  return res.data ?? [];
};

export type MemberSearchHit = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export const searchMembersByQuery = async (query: string): Promise<MemberSearchHit[]> => {
  const res = await api.searchUsers(query);
  return res.data ?? [];
};

export type MemberUserBrief = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export const fetchUserBrief = async (userId: string): Promise<MemberUserBrief> => {
  const res = await api.getUserBrief(userId);
  return res.data;
};
