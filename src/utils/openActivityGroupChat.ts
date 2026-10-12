import type { NavigateFunction } from 'react-router-dom';
import { fetchActivityGroupChatGroupId } from '../hooks/activityGroupChatClientApi';
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
  const groupId = await fetchActivityGroupChatGroupId(activityId);
  navigateToActivityGroupChat(navigate, groupId, options?.returnTo, activityId);
};
