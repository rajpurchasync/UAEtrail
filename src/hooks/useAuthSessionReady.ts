import { useAuth } from '../context/AuthContext';

/** True when guest or refresh bootstrap has finished — safe for `auth: true` API calls. */
export const useAuthSessionReady = (): boolean => {
  const { user, initializing } = useAuth();
  return !user || !initializing;
};