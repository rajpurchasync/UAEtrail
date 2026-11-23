import type { FriendRequestDTO, FriendSummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { fetchMeGroups } from './groupClientApi';

export const fetchMeFriends = async (): Promise<FriendSummaryDTO[]> => {
  const res = await api.getMeFriends();
  return res.data;
};

export const fetchMeFriendRequests = async (
  direction: 'incoming' | 'outgoing' | 'all' = 'all'
): Promise<FriendRequestDTO[]> => {
  const res = await api.getMeFriendRequests(direction);
  return res.data ?? [];
};

export const fetchActivityJoinInvitesSentInviteeIds = async (
  activityId: string
): Promise<string[]> => {
  const res = await api.listActivityJoinInvitesSent(activityId);
  return res.data.inviteeUserIds;
};

export { fetchMeGroups };

export const sendActivityJoinInvitesToFriends = async (
  activityId: string,
  inviteeUserIds: string[]
): Promise<number> => {
  const res = await api.sendActivityJoinInvites(activityId, inviteeUserIds);
  return res.data.sent;
};