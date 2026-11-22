import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchExploreCommunityBySlug,
  joinDiscoverableCommunity as joinDiscoverableCommunityRequest,
} from '@/hooks/communityDiscoverClientApi';
import { FEATURE_FLAGS } from '@/config/platform';
import { useAuth } from '@/context/AuthContext';

const communityDetailQueryKey = (slug: string, viewerId: string | null) =>
  ['explore', 'communities', 'detail', slug, viewerId] as const;

export const useCommunityDiscoverDetail = (slug: string | undefined, enabled?: boolean) => {
  const { user } = useAuth();
  const active = enabled ?? FEATURE_FLAGS.communityDiscover;

  return useQuery({
    queryKey: communityDetailQueryKey(slug ?? '', user?.id ?? null),
    enabled: active && Boolean(slug),
    queryFn: async () => {
      return fetchExploreCommunityBySlug(slug!, { auth: Boolean(user) });
    },
  });
};

export const useJoinDiscoverableCommunity = (slug: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (communityId: string) => {
      return joinDiscoverableCommunityRequest(communityId);
    },
    onSuccess: () => {
      if (!slug) return;
      void queryClient.invalidateQueries({
        queryKey: communityDetailQueryKey(slug, user?.id ?? null),
      });
      void queryClient.invalidateQueries({ queryKey: ['explore', 'communities'] });
    },
  });
};