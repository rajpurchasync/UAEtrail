import { useQuery } from '@tanstack/react-query';
import type { SocialPeopleSegment } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { memberPeopleNetworkQueryKey } from './memberDiscoveryQueryKeys';

type UseMemberPeopleArgs = {
  enabled: boolean;
  segment: SocialPeopleSegment;
};

const MEMBER_PEOPLE_STALE_MS = 60_000;

/** Browse network roster (friends / followed) for the explore people panel. */
export const useMemberPeople = ({ enabled, segment }: UseMemberPeopleArgs) => {
  const query = useQuery({
    queryKey: memberPeopleNetworkQueryKey(segment),
    enabled,
    staleTime: MEMBER_PEOPLE_STALE_MS,
    queryFn: async () => {
      const response = await api.getSocialPeople(segment);
      return response.data;
    },
  });

  return {
    people: query.data?.people ?? [],
    loading: enabled && query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? 'Could not load people.' : null,
    refresh: () => query.refetch(),
  };
};
