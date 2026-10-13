import { api } from '../api/index';
import { getStoredSession, setStoredSession } from '../api/client';

export const switchMeRoleSession = async (
  target: 'participant' | 'original'
): Promise<{
  data: { role: string; switchedFromRole: string | null };
  tokens: { accessToken: string };
}> => {
  return api.switchMeRole(target);
};

export const persistAuthSessionTokens = (tokens: { accessToken: string }): void => {
  setStoredSession(tokens);
};

export const readStoredAccessToken = (): string | null => getStoredSession()?.accessToken ?? null;
