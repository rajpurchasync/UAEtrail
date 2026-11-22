import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchExploreCommunityActivities,
  linkDiscoverableCommunityActivity,
} from '@/hooks/communityDiscoverClientApi';
import { FEATURE_FLAGS } from '@/config/platform';

const communityActivitiesQueryKey = (slug: string) =>
  ['explore', 'communities', 'activities', slug] as const;

export const useCommunityDiscoverActivities = (slug: string | undefined) => {
  const active = FEATURE_FLAGS.communityDiscover;
  return useQuery({
    queryKey: communityActivitiesQueryKey(slug ?? ''),
    enabled: active && Boolean(slug),
    queryFn: () => fetchExploreCommunityActivities(slug!),
    staleTime: 60_000,
  });
};

export const useLinkCommunityActivity = (slug: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { communityId: string; activityId: string }) => {
      return linkDiscoverableCommunityActivity(input.communityId, input.activityId);
    },
    onSuccess: () => {
      if (!slug) return;
      void queryClient.invalidateQueries({ queryKey: communityActivitiesQueryKey(slug) });
    },
  });
};