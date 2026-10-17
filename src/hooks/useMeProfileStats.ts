import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchMeProfileStats, fetchMeProfileViewStats } from './memberProfileApi';
import { meProfileStatsQueryKey, meProfileViewStatsQueryKey } from './clientQueryKeys';

export const useMeProfileStats = (enabled = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? meProfileStatsQueryKey(user.id) : ['me', 'profile-stats', ''],
    queryFn: fetchMeProfileStats,
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  });
};

export const useMeProfileViewStats = (enabled = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? meProfileViewStatsQueryKey(user.id) : ['me', 'profile-view-stats', ''],
    queryFn: fetchMeProfileViewStats,
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  });
};
