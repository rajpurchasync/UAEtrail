import { useQuery } from '@tanstack/react-query';
import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { exploreApi } from '../../api/domains/explore';
import { FEATURE_FLAGS } from '../../config/platform';

const communityDiscoverQueryKey = ['explore', 'communities'] as const;

export const useCommunityDiscoverList = (enabled?: boolean) => {
  const active = enabled ?? FEATURE_FLAGS.communityDiscover;
  return useQuery({
    queryKey: communityDiscoverQueryKey,
    queryFn: async (): Promise<CommunityDiscoverCardDTO[]> => {
      const res = await exploreApi.getExploreCommunities();
      return res.data;
    },
    enabled: active,
    staleTime: 60_000,
  });
};