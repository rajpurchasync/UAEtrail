import type { NavigateFunction } from 'react-router-dom';
import { api } from '../api/index';
import { navigateToActivityGroupChat } from './activityGroupChatNav';

/** Resolve activity crew chat group id (if needed) and open Messages thread. */
export const openActivityGroupChat = async (
  navigate: NavigateFunction,
  activityId: string,
  groupChatId?: string | null,
  options?: { returnTo?: string }
): Promise<void> => {
  if (groupChatId) {
    navigateToActivityGroupChat(navigate, groupChatId, options?.returnTo, activityId);
    return;
  }
  const res = await api.getActivityGroupChat(activityId);
  navigateToActivityGroupChat(navigate, res.data.groupId, options?.returnTo, activityId);
};
