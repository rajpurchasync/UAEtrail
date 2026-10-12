import type { BuddySummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { SocialGroupView } from '../api/types';

export const fetchMeBuddies = async (): Promise<BuddySummaryDTO[]> => {
  const res = await api.getMeBuddies();
  return res.data;
};

export const fetchActivityJoinInvitesSentInviteeIds = async (
  activityId: string
): Promise<string[]> => {
  const res = await api.listActivityJoinInvitesSent(activityId);
  return res.data.inviteeUserIds;
};

export const fetchMeSocialGroups = async (): Promise<SocialGroupView[]> => {
  const res = await api.getMeGroups();
  return res.data;
};

export const sendActivityJoinInvitesToBuddies = async (
  activityId: string,
  inviteeUserIds: string[]
): Promise<number> => {
  const res = await api.sendActivityJoinInvites(activityId, inviteeUserIds);
  return res.data.sent;
};
