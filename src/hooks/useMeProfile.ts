import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchMeProfile } from './memberProfileApi';
import { meProfileQueryKey } from './clientQueryKeys';

export const useMeProfile = (enabled = true) => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: user ? meProfileQueryKey(user.id) : ['me', 'profile', ''],
    queryFn: fetchMeProfile,
    enabled: enabled && Boolean(user),
    staleTime: 30_000,
  });

  return {
    profile: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
