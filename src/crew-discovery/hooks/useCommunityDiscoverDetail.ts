import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommunityDiscoverDetailDTO, CommunityHostProfilePatchDTO } from '@uaetrail/shared-types';
import {
  fetchExploreCommunityBySlug,
  joinDiscoverableCommunity as joinDiscoverableCommunityRequest,
  leaveDiscoverableCommunity as leaveDiscoverableCommunityRequest,
  patchCommunityProfileByHost as patchCommunityProfileByHostRequest,
} from '@/hooks/communityDiscoverClientApi';
import { FEATURE_FLAGS } from '@/config/platform';
import { useAuth } from '@/context/AuthContext';
import { meCommunitiesQueryKey } from '@/crew-discovery/hooks/useMeCommunityDiscoverList';

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

const invalidateCommunityDetail = (
  queryClient: ReturnType<typeof useQueryClient>,
  slug: string | undefined,
  userId: string | null
) => {
  if (!slug) return;
  void queryClient.invalidateQueries({
    queryKey: communityDetailQueryKey(slug, userId),
  });
  void queryClient.invalidateQueries({ queryKey: ['explore', 'communities'] });
  void queryClient.invalidateQueries({ queryKey: meCommunitiesQueryKey });
};

export const useJoinDiscoverableCommunity = (slug: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (communityId: string) => {
      return joinDiscoverableCommunityRequest(communityId);
    },
    onSuccess: () => {
      invalidateCommunityDetail(queryClient, slug, user?.id ?? null);
    },
  });
};

export const useLeaveDiscoverableCommunity = (slug: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (communityId: string) => {
      return leaveDiscoverableCommunityRequest(communityId);
    },
    onSuccess: (detail: CommunityDiscoverDetailDTO) => {
      if (!slug) return;
      queryClient.setQueryData(communityDetailQueryKey(slug, user?.id ?? null), detail);
      void queryClient.invalidateQueries({ queryKey: ['explore', 'communities'] });
    },
  });
};

export const usePatchCommunityProfileByHost = (slug: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { communityId: string; patch: CommunityHostProfilePatchDTO }) => {
      return patchCommunityProfileByHostRequest(input.communityId, input.patch);
    },
    onSuccess: (detail: CommunityDiscoverDetailDTO) => {
      if (!slug) return;
      queryClient.setQueryData(communityDetailQueryKey(slug, user?.id ?? null), detail);
      void queryClient.invalidateQueries({ queryKey: ['explore', 'communities'] });
    },
  });
};