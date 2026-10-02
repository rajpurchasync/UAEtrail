import type { NavigateFunction } from 'react-router-dom';
import { messagesGroupPath } from '../config/routingCatalog';
import { resolveAuthRedirect } from './authRedirect';

/** Deep link to the single group chat tied to an activity (Messages tab). */
export const activityGroupChatPath = (groupId: string): string => messagesGroupPath(groupId);

/** Router state key — return path after closing an activity crew chat thread. */
export const MESSAGES_CHAT_RETURN_TO_KEY = 'messagesReturnTo';

export const parseMessagesChatReturnTo = (state: unknown): string | undefined => {
  if (!state || typeof state !== 'object') return undefined;
  const raw = (state as Record<string, unknown>)[MESSAGES_CHAT_RETURN_TO_KEY];
  if (typeof raw !== 'string') return undefined;
  return resolveAuthRedirect(raw, null);
};

export const navigateToActivityGroupChat = (
  navigate: NavigateFunction,
  groupId: string,
  returnTo?: string
): void => {
  const safeReturn = returnTo ? resolveAuthRedirect(returnTo, null) : undefined;
  navigate(activityGroupChatPath(groupId), {
    state: safeReturn ? { [MESSAGES_CHAT_RETURN_TO_KEY]: safeReturn } : undefined,
  });
};
