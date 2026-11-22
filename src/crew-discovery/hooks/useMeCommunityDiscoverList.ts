import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { MeCreateCommunityDiscoverDTO } from '@uaetrail/shared-types';
import {
  createDiscoverableCommunity,
  fetchMeCommunities,
} from '@/hooks/communityDiscoverClientApi';
import { FEATURE_FLAGS } from '@/config/platform';
import { useAuth } from '@/context/AuthContext';

export const meCommunitiesQueryKey = ['me', 'communities'] as const;

export const useMeCommunityDiscoverList = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: meCommunitiesQueryKey,
    enabled: FEATURE_FLAGS.communityDiscover && Boolean(user),
    queryFn: fetchMeCommunities,
    staleTime: 30_000,
  });
};

export const useCreateDiscoverableCommunity = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: MeCreateCommunityDiscoverDTO) => createDiscoverableCommunity(body),
    onSuccess: (result) => {
      queryClient.setQueryData(meCommunitiesQueryKey, result.list);
      void queryClient.invalidateQueries({ queryKey: ['explore', 'communities'] });
      navigate(`/clubs/${result.detail.slug}`);
    },
  });
};