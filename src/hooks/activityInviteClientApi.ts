import type { BuddyRequestDTO, BuddySummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { fetchMeGroups } from './groupClientApi';

export const fetchMeBuddies = async (): Promise<BuddySummaryDTO[]> => {
  const res = await api.getMeBuddies();
  return res.data;
};

/** Friends roster — `GET /me/friends` (read alias of buddies wire). */
export const fetchMeFriends = async (): Promise<BuddySummaryDTO[]> => {
  const res = await api.getMeFriends();
  return res.data;
};

export const fetchMeBuddyRequests = async (
  direction: 'incoming' | 'outgoing' | 'all' = 'all'
): Promise<BuddyRequestDTO[]> => {
  const res = await api.getMeBuddyRequests(direction);
  return res.data ?? [];
};

export const fetchActivityJoinInvitesSentInviteeIds = async (
  activityId: string
): Promise<string[]> => {
  const res = await api.listActivityJoinInvitesSent(activityId);
  return res.data.inviteeUserIds;
};

export { fetchMeGroups };

export const sendActivityJoinInvitesToBuddies = async (
  activityId: string,
  inviteeUserIds: string[]
): Promise<number> => {
  const res = await api.sendActivityJoinInvites(activityId, inviteeUserIds);
  return res.data.sent;
};
