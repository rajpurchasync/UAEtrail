import { api } from '../api/index';

export type ActivityGroupChatStatus = {
  groupId: string | null;
  membershipId: string | null;
  isMember: boolean;
  canLeave: boolean;
};

export const fetchActivityGroupChatStatus = async (
  activityId: string
): Promise<ActivityGroupChatStatus> => {
  const res = await api.getActivityGroupChatStatus(activityId);
  return res.data;
};

export const joinActivityGroupChatSession = async (
  activityId: string
): Promise<ActivityGroupChatStatus> => {
  const res = await api.joinActivityGroupChat(activityId);
  return res.data;
};

export const leaveActivityGroupChatSession = async (activityId: string): Promise<void> => {
  await api.leaveActivityGroupChat(activityId);
};

export const fetchActivityGroupChatGroupId = async (activityId: string): Promise<string> => {
  const res = await api.getActivityGroupChat(activityId);
  return res.data.groupId;
};
