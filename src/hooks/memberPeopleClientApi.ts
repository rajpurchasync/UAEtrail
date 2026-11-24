import type {
  FriendRelationshipDTO,
  FriendRequestDTO,
  MemberFollowSummaryDTO,
  MemberDiscoveryQuotaDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryAvailabilityRowDTO,
  SocialPeopleDTO,
  SocialPeoplePreviewDTO,
  SocialPeopleSegment,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { ExploreAvailabilityIndex } from '../api/domains/availability';
import { crewDiscoverApi } from '../api/domains/crewDiscover';
import { api } from '../api/index';

export type { ExploreAvailabilityIndex };

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
  availabilityOnMap: MemberDiscoveryAvailabilityRowDTO[];
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
  const res = await crewDiscoverApi.getDiscoverCrewFeed(options);
  const feed = res.data;
  return {
    friendsGoing: feed.friendsGoing ?? [],
    hostsGoing: feed.hostsGoing ?? [],
    availabilityOnMap: feed.availabilityOnMap ?? [],
    followed: feed.followed ?? [],
    directory: feed.directory ?? [],
    quota: res.meta.quota,
  };
};

export const fetchExplorePeopleAvailability = async (params: {
  from: string;
  to: string;
  kind?: string;
  area?: string;
  region?: string;
  friendsOnly?: boolean;
}): Promise<ExploreAvailabilityIndex> => {
  const res = await api.explorePeopleAvailability(params);
  return res.data;
};

export const sendMemberFriendRequest = async (
  targetUserId: string,
  message?: string
): Promise<FriendRequestDTO> => {
  const res = await api.sendFriendRequest({ targetUserId, message });
  return res.data;
};

export const fetchFriendRelationship = async (userId: string): Promise<FriendRelationshipDTO> => {
  const res = await api.getFriendRelationship(userId);
  return res.data;
};

export const acceptMemberFriendRequest = async (requestId: string): Promise<FriendRequestDTO> => {
  const res = await api.acceptFriendRequest(requestId);
  return res.data;
};

export const declineMemberFriendRequest = async (requestId: string): Promise<FriendRequestDTO> => {
  const res = await api.declineFriendRequest(requestId);
  return res.data;
};

export const cancelMemberFriendRequest = async (requestId: string): Promise<FriendRequestDTO> => {
  const res = await api.cancelFriendRequest(requestId);
  return res.data;
};

export const unfriendMember = async (userId: string): Promise<void> => {
  await api.unfriendMember(userId);
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
